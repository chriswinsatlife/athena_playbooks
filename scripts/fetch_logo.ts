#!/usr/bin/env bun
/**
 * fetch_logo.ts - Fetch and save tool logos for playbooks
 * 
 * Usage:
 *   bun scripts/fetch_logo.ts airtable
 *   bun scripts/fetch_logo.ts "Google Calendar"
 *   bun scripts/fetch_logo.ts notion.so
 *   bun scripts/fetch_logo.ts --list              # Show all available svgporn logos
 *   bun scripts/fetch_logo.ts --search calendar   # Search svgporn logos
 * 
 * Sources (in order):
 *   1. gilbarbara/logos (svgporn) - SVG, free, curated tech logos
 *   2. Firecrawl branding endpoint - Extracts logo from any website
 * 
 * Output: /public/logos/{slug}.svg or .png
 */

import { parseArgs } from "util"
import { existsSync } from "fs"
import { join } from "path"

const SVGPORN_LOGOS_URL = "https://raw.githubusercontent.com/gilbarbara/logos/main/logos.json"
const SVGPORN_CDN = "https://cdn.svgporn.com/logos"
const LOGOS_DIR = join(import.meta.dir, "..", "public", "logos")

interface SvgPornLogo {
  name: string
  shortname: string
  url: string
  files: string[]
}

interface FirecrawlBranding {
  logo?: string
  images?: {
    logo?: string
    favicon?: string
    ogImage?: string
  }
}

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
}

function log(msg: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

// Fetch and cache svgporn logos.json
let logosCache: SvgPornLogo[] | null = null

async function getSvgPornLogos(): Promise<SvgPornLogo[]> {
  if (logosCache) return logosCache
  
  const res = await fetch(SVGPORN_LOGOS_URL)
  if (!res.ok) throw new Error(`Failed to fetch logos.json: ${res.status}`)
  
  logosCache = await res.json() as SvgPornLogo[]
  return logosCache
}

// Normalize input to match svgporn slugs
function normalizeQuery(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

// Find a logo in svgporn by name or shortname
async function findSvgPornLogo(query: string): Promise<SvgPornLogo | null> {
  const logos = await getSvgPornLogos()
  const normalized = normalizeQuery(query)
  
  // Exact shortname match
  let match = logos.find(l => l.shortname === query.toLowerCase())
  if (match) return match
  
  // Exact name match (case insensitive)
  match = logos.find(l => l.name.toLowerCase() === query.toLowerCase())
  if (match) return match
  
  // Normalized match
  match = logos.find(l => 
    normalizeQuery(l.name) === normalized ||
    normalizeQuery(l.shortname) === normalized
  )
  if (match) return match
  
  // Partial match
  match = logos.find(l => 
    normalizeQuery(l.name).includes(normalized) ||
    normalizeQuery(l.shortname).includes(normalized)
  )
  
  return match || null
}

// Get the best file from a logo (prefer -icon.svg)
function getBestFile(logo: SvgPornLogo): string {
  // Prefer icon versions for chips
  const iconFile = logo.files.find(f => f.includes("-icon."))
  if (iconFile) return iconFile
  
  // Otherwise first file
  return logo.files[0]
}

// Download file from URL
async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  
  const buffer = await res.arrayBuffer()
  await Bun.write(dest, buffer)
}

// Fetch logo via Firecrawl branding endpoint
async function fetchViaFirecrawl(domain: string): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    log("FIRECRAWL_API_KEY not set, skipping Firecrawl fallback", "yellow")
    return null
  }
  
  // Ensure domain has protocol
  const url = domain.includes("://") ? domain : `https://${domain}`
  
  log(`Trying Firecrawl branding for ${url}...`, "dim")
  
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["branding"],
      }),
    })
    
    if (!res.ok) {
      log(`Firecrawl returned ${res.status}`, "yellow")
      return null
    }
    
    const data = await res.json() as { success: boolean; data?: { branding?: FirecrawlBranding } }
    
    if (!data.success || !data.data?.branding) {
      log("No branding data returned", "yellow")
      return null
    }
    
    const branding = data.data.branding
    
    // Try to get logo URL from branding response
    const logoUrl = branding.logo || branding.images?.logo || branding.images?.favicon
    
    if (!logoUrl) {
      log("No logo URL in branding response", "yellow")
      return null
    }
    
    return logoUrl
  } catch (err) {
    log(`Firecrawl error: ${err}`, "red")
    return null
  }
}

// Extract domain from URL or return as-is if it looks like a domain
function extractDomain(input: string): string | null {
  // If it's a URL, extract domain
  if (input.includes("://")) {
    try {
      const url = new URL(input)
      return url.hostname.replace(/^www\./, "")
    } catch {
      return null
    }
  }
  
  // If it looks like a domain (has a dot)
  if (input.includes(".")) {
    return input.replace(/^www\./, "")
  }
  
  return null
}

// Extract base name from domain (airtable.com -> airtable)
function extractBaseName(input: string): string {
  const domain = extractDomain(input)
  if (domain) {
    // Get first part before the TLD
    return domain.split(".")[0]
  }
  return input
}

// Main fetch logic
async function fetchLogo(query: string): Promise<boolean> {
  // Extract base name for slug (airtable.com -> airtable)
  const baseName = extractBaseName(query)
  const slug = baseName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
  
  // Check if already exists
  const svgPath = join(LOGOS_DIR, `${slug}.svg`)
  const pngPath = join(LOGOS_DIR, `${slug}.png`)
  
  if (existsSync(svgPath)) {
    log(`Already exists: ${svgPath}`, "yellow")
    return true
  }
  if (existsSync(pngPath)) {
    log(`Already exists: ${pngPath}`, "yellow")
    return true
  }
  
  // Try svgporn first - use base name for lookup
  log(`Searching svgporn for "${baseName}"...`, "dim")
  const svgpornLogo = await findSvgPornLogo(baseName)
  
  if (svgpornLogo) {
    const file = getBestFile(svgpornLogo)
    const url = `${SVGPORN_CDN}/${file}`
    
    log(`Found: ${svgpornLogo.name} -> ${file}`, "cyan")
    
    // Use svgporn shortname for consistency
    const destPath = join(LOGOS_DIR, `${svgpornLogo.shortname}.svg`)
    
    await downloadFile(url, destPath)
    log(`Saved: ${destPath}`, "green")
    
    // If query slug differs from shortname, note it
    if (slug !== svgpornLogo.shortname) {
      log(`Note: Use slug "${svgpornLogo.shortname}" in playbook data`, "yellow")
    }
    
    return true
  }
  
  log("Not found in svgporn", "dim")
  
  // Try Firecrawl - use domain if provided, otherwise guess .com
  const domain = extractDomain(query) || `${query}.com`
  const logoUrl = await fetchViaFirecrawl(domain)
  
  if (logoUrl) {
    log(`Found logo: ${logoUrl.substring(0, 80)}...`, "cyan")
    
    // Handle data URIs - extract and save directly
    if (logoUrl.startsWith("data:")) {
      const isSvg = logoUrl.includes("image/svg") || logoUrl.includes("%3Csvg")
      const ext = isSvg ? "svg" : "png"
      const destPath = join(LOGOS_DIR, `${slug}.${ext}`)
      
      if (isSvg) {
        // Extract SVG content from data URI
        let svgContent: string
        if (logoUrl.includes("base64,")) {
          // Base64 encoded
          const base64 = logoUrl.split("base64,")[1]
          svgContent = Buffer.from(base64, "base64").toString("utf-8")
        } else {
          // URL encoded (data:image/svg+xml;utf8,...)
          const encoded = logoUrl.split(",").slice(1).join(",")
          svgContent = decodeURIComponent(encoded)
        }
        await Bun.write(destPath, svgContent)
      } else {
        // For non-SVG data URIs, extract binary
        const base64 = logoUrl.split("base64,")[1]
        if (base64) {
          const buffer = Buffer.from(base64, "base64")
          await Bun.write(destPath, buffer)
        } else {
          log("Cannot decode non-base64 data URI", "red")
          return false
        }
      }
      
      log(`Saved: ${destPath}`, "green")
      return true
    }
    
    // Regular URL - download file
    const ext = logoUrl.toLowerCase().includes(".svg") ? "svg" : "png"
    const destPath = join(LOGOS_DIR, `${slug}.${ext}`)
    
    await downloadFile(logoUrl, destPath)
    log(`Saved: ${destPath}`, "green")
    return true
  }
  
  log(`Could not find logo for "${query}"`, "red")
  return false
}

// List all svgporn logos
async function listLogos(): Promise<void> {
  const logos = await getSvgPornLogos()
  
  console.log(`\n${logos.length} logos available:\n`)
  
  for (const logo of logos) {
    console.log(`  ${logo.shortname.padEnd(30)} ${logo.name}`)
  }
}

// Search svgporn logos
async function searchLogos(query: string): Promise<void> {
  const logos = await getSvgPornLogos()
  const normalized = normalizeQuery(query)
  
  const matches = logos.filter(l => 
    normalizeQuery(l.name).includes(normalized) ||
    normalizeQuery(l.shortname).includes(normalized)
  )
  
  if (matches.length === 0) {
    log(`No matches for "${query}"`, "yellow")
    return
  }
  
  console.log(`\n${matches.length} matches for "${query}":\n`)
  
  for (const logo of matches) {
    console.log(`  ${logo.shortname.padEnd(30)} ${logo.name}`)
    for (const file of logo.files) {
      console.log(`    ${colors.dim}${SVGPORN_CDN}/${file}${colors.reset}`)
    }
  }
}

// Parse CLI args and run
async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      list: { type: "boolean", short: "l" },
      search: { type: "string", short: "s" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  })
  
  if (values.help || (positionals.length === 0 && !values.list && !values.search)) {
    console.log(`
Usage: bun scripts/fetch_logo.ts [options] <query...>

Fetch tool logos for playbooks from svgporn or Firecrawl.

Options:
  -l, --list            List all available svgporn logos
  -s, --search <term>   Search svgporn logos
  -h, --help            Show this help

Examples:
  bun scripts/fetch_logo.ts airtable
  bun scripts/fetch_logo.ts "Google Calendar" notion asana
  bun scripts/fetch_logo.ts mercury.com
  bun scripts/fetch_logo.ts --search calendar
  bun scripts/fetch_logo.ts --list
`)
    return
  }
  
  if (values.list) {
    await listLogos()
    return
  }
  
  if (values.search) {
    await searchLogos(values.search)
    return
  }
  
  // Fetch logos for each positional arg
  let success = 0
  let failed = 0
  
  for (const query of positionals) {
    console.log()
    const ok = await fetchLogo(query)
    if (ok) success++
    else failed++
  }
  
  console.log()
  log(`Done: ${success} saved, ${failed} failed`, success > 0 ? "green" : "red")
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
