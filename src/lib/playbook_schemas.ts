/**
 * Playbook Zod Schemas
 *
 * Pure Zod schemas for playbook content validation.
 * Used by both Astro content collections and standalone generation scripts.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared Enums
// ---------------------------------------------------------------------------

export const areaEnum = z.enum([
  'physical-health',
  'mental-health',
  'relationships',
  'personal-finance',
  'learning-pkm',
  'passion-projects',
  'bucket-list',
  'experiences-travel',
  'admin',
  'finance',
  'people',
  'marketing',
  'sales',
  'product',
  'engineering',
  'operations',
]).describe('Life/work area from the 16-area ontology');

export const contentTypeEnum = z.enum([
  'playbook',
  'routine',
  'stack',
  'sop',
  'guide',
]).describe('Content type classification');

export const modeEnum = z.enum([
  'light',
  'dark',
  'auto',
]).describe('Display mode for UI components');

// ---------------------------------------------------------------------------
// Embed Schemas
// ---------------------------------------------------------------------------

export const diagramEmbedSchema = z.object({
  type: z.literal('diagram'),
  id: z.string().describe('Unique identifier for the diagram'),
  src: z.string().describe('Path to rendered SVG file'),
  alt: z.string().describe('Accessible alt text'),
  caption: z.string().optional().describe('Optional caption below diagram'),
}).describe('Mermaid/D3 diagram embed');

export const notificationSchema = z.object({
  app: z.string().describe('App name displayed in notification'),
  title: z.string().describe('Notification title'),
  body: z.string().optional().describe('Notification body text'),
  time: z.string().optional().describe('Timestamp display text'),
  icon: z.string().optional().describe('Icon path or identifier'),
}).describe('Single notification item');

export const notificationsEmbedSchema = z.object({
  type: z.literal('notifications'),
  style: z.enum(['macos', 'ios', 'android', 'windows', 'liquidglass']).describe('Platform style'),
  mode: modeEnum.optional(),
  notifications: z.array(notificationSchema).describe('List of notifications to display'),
}).describe('Push notification mockup embed');

export const messageSchema = z.object({
  user: z.number().describe('User identifier (1 = client, 2 = EA/other)'),
  text: z.string().describe('Message text content'),
  name: z.string().optional().describe('Display name for sender'),
  avatar: z.string().optional().describe('Avatar image path'),
  timestamp: z.string().optional().describe('Message timestamp'),
}).describe('Single chat message');

export const messagesEmbedSchema = z.object({
  type: z.literal('messages'),
  style: z.enum(['whatsapp', 'imessage', 'chatgpt', 'claudecode', 'opencode', 'telegram']).describe('Chat platform style'),
  mode: modeEnum.optional(),
  agent: z.string().optional().describe('Agent name for OpenCode footer'),
  messages: z.array(messageSchema).describe('Chat messages to display'),
}).describe('Chat conversation mockup embed');

export const calendarEventSchema = z.object({
  title: z.string().describe('Event title'),
  start: z.string().describe('Start datetime (ISO 8601 or time string)'),
  end: z.string().describe('End datetime (ISO 8601 or time string)'),
  color: z.enum(['blue', 'green', 'red', 'purple', 'orange', 'cyan', 'pink', 'yellow']).optional().describe('Event color'),
  location: z.string().optional().describe('Event location'),
}).describe('Single calendar event');

export const calendarEmbedSchema = z.object({
  type: z.literal('calendar'),
  style: z.enum(['google', 'apple', 'outlook']).describe('Calendar platform style'),
  view: z.enum(['week', 'day']).optional().describe('Calendar view type'),
  mode: modeEnum.optional(),
  date: z.string().optional().describe('Focus date for the calendar view'),
  events: z.array(calendarEventSchema).describe('Events to display'),
}).describe('Calendar UI mockup embed');

export const emailContactSchema = z.object({
  name: z.string().describe('Contact display name'),
  email: z.string().describe('Email address'),
}).describe('Email contact');

export const emailAttachmentSchema = z.object({
  name: z.string().describe('Attachment filename'),
  size: z.string().optional().describe('File size display text'),
  type: z.enum(['pdf', 'doc', 'image', 'spreadsheet', 'archive', 'other']).optional().describe('Attachment type for icon'),
}).describe('Email attachment');

export const emailMessageSchema = z.object({
  from: emailContactSchema.describe('Sender'),
  to: z.array(emailContactSchema).describe('Recipients'),
  cc: z.array(emailContactSchema).optional().describe('CC recipients'),
  body: z.string().describe('Email body (supports markdown)'),
  date: z.string().describe('Send date/time'),
  attachments: z.array(emailAttachmentSchema).optional().describe('File attachments'),
}).describe('Single email message in thread');

export const emailEmbedSchema = z.object({
  type: z.literal('email'),
  subject: z.string().describe('Email thread subject'),
  labels: z.array(z.string()).optional().describe('Gmail-style labels'),
  mode: modeEnum.optional(),
  messages: z.array(emailMessageSchema).describe('Email messages in thread'),
}).describe('Email thread mockup embed');

export const columnDefinitionSchema = z.object({
  key: z.string().describe('Data field key'),
  label: z.string().optional().describe('Column header label'),
  type: z.enum(['text', 'number', 'checkbox', 'tag', 'date', 'url']).optional().describe('Column data type'),
}).describe('Data table column definition');

export const datatableEmbedSchema = z.object({
  type: z.literal('datatable'),
  style: z.enum(['sheets', 'notion', 'airtable', 'excel', 'plain']).describe('Database platform style'),
  data: z.array(z.record(z.unknown())).describe('Row data as array of objects'),
  columns: z.array(columnDefinitionSchema).optional().describe('Column definitions'),
  showRowNumbers: z.boolean().optional().describe('Show row numbers'),
  showHeader: z.boolean().optional().describe('Show header row'),
}).describe('Data table/database view embed');

export const imageEmbedSchema = z.object({
  type: z.literal('image'),
  src: z.string().describe('Image source path'),
  alt: z.string().describe('Accessible alt text'),
  caption: z.string().optional().describe('Image caption'),
  width: z.number().optional().describe('Display width in pixels'),
}).describe('Image embed');

// Base embed types (without comparison to avoid circular reference)
const baseEmbedTypes = [
  diagramEmbedSchema,
  notificationsEmbedSchema,
  messagesEmbedSchema,
  calendarEmbedSchema,
  emailEmbedSchema,
  datatableEmbedSchema,
  imageEmbedSchema,
] as const;

export const baseEmbedSchema = z.discriminatedUnion('type', [...baseEmbedTypes]);

export const comparisonEmbedSchema = z.object({
  type: z.literal('comparison'),
  layout: z.enum(['side-by-side', 'stacked']).optional().describe('Comparison layout'),
  before: z.object({
    label: z.string().describe('Before label'),
    embed: baseEmbedSchema.describe('Before state embed'),
  }).describe('Before state'),
  after: z.object({
    label: z.string().describe('After label'),
    embed: baseEmbedSchema.describe('After state embed'),
  }).describe('After state'),
}).describe('Before/after comparison embed');

// Full embed schema including comparison
export const embedSchema = z.discriminatedUnion('type', [
  ...baseEmbedTypes,
  comparisonEmbedSchema,
]).describe('Embed component for rich content');

export type Embed = z.infer<typeof embedSchema>;

// ---------------------------------------------------------------------------
// Section Content Schemas
// ---------------------------------------------------------------------------

export const specsItemSchema = z.object({
  label: z.string().describe('Specification label'),
  value: z.string().describe('Specification value'),
}).describe('Key-value specification item');

export const checklistItemSchema = z.object({
  label: z.string().describe('Checklist item label'),
  details: z.string().optional().describe('Additional details or time estimate'),
  substeps: z.array(z.string()).optional().describe('Nested substeps'),
}).describe('Checklist item with optional substeps');

export const stepsItemSchema = z.object({
  label: z.string().describe('Step label'),
  details: z.string().optional().describe('Step details or instructions'),
}).describe('Numbered step item');

export const proseContentSchema = z.object({
  format: z.literal('prose'),
  text: z.string().describe('Markdown text content'),
}).describe('Prose/narrative content format');

export const specsContentSchema = z.object({
  format: z.literal('specs'),
  items: z.array(specsItemSchema).describe('Key-value specifications'),
}).describe('Specifications list format');

export const checklistContentSchema = z.object({
  format: z.literal('checklist'),
  items: z.array(checklistItemSchema).describe('Checklist items'),
}).describe('Checklist format with checkboxes');

export const stepsContentSchema = z.object({
  format: z.literal('steps'),
  items: z.array(stepsItemSchema).describe('Ordered steps'),
}).describe('Numbered steps format');

export const sectionContentSchema = z.discriminatedUnion('format', [
  proseContentSchema,
  specsContentSchema,
  checklistContentSchema,
  stepsContentSchema,
]).describe('Section content in various formats');

export type SectionContent = z.infer<typeof sectionContentSchema>;

// ---------------------------------------------------------------------------
// Section Schema
// ---------------------------------------------------------------------------

export const calloutSchema = z.object({
  type: z.enum(['tip', 'warning', 'tool', 'example', 'quote']).describe('Callout type'),
  title: z.string().optional().describe('Callout title'),
  content: z.string().describe('Callout content'),
  tool_slug: z.string().optional().describe('Reference to tool in tools array'),
}).describe('Highlighted callout box');

export const sectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).describe('URL-safe section identifier'),
  title: z.string().describe('Section heading'),
  icon: z.string().optional().describe('Icon name from icon set'),
  content: sectionContentSchema.describe('Main section content'),
  embeds: z.array(embedSchema).optional().describe('Rich UI mockups illustrating the content'),
  callout: calloutSchema.optional().describe('Highlighted tip/warning/tool'),
}).describe('Playbook content section');

export type Section = z.infer<typeof sectionSchema>;

// ---------------------------------------------------------------------------
// Tool & Template Schemas
// ---------------------------------------------------------------------------

export const toolSchema = z.object({
  name: z.string().describe('Tool display name'),
  slug: z.string().optional().describe('URL-safe tool identifier'),
  category: z.string().describe('Tool category'),
  logo: z.string().optional().describe('Logo image path'),
  url: z.string().url().optional().describe('Official tool URL'),
  affiliate_url: z.string().url().optional().describe('Affiliate link URL'),
  description: z.string().max(100).optional().describe('Brief tool description'),
  required: z.boolean().default(false).describe('Whether tool is required'),
  alternatives: z.array(z.string()).optional().describe('Alternative tool names'),
}).describe('Tool used in playbook');

export const templateSchema = z.object({
  name: z.string().describe('Template name'),
  platform: z.enum(['airtable', 'notion', 'google-sheets', 'zapier', 'asana', 'coda', 'other']).describe('Template platform'),
  url: z.string().url().describe('Template URL'),
  description: z.string().optional().describe('Template description'),
}).describe('Downloadable template');

// ---------------------------------------------------------------------------
// Hero & Before/After Schemas
// ---------------------------------------------------------------------------

export const heroStatSchema = z.object({
  value: z.string().describe('Stat value (e.g., "30s", "5h")'),
  label: z.string().describe('Stat label'),
}).describe('Hero statistic');

export const heroImageSchema = z.object({
  src: z.string().describe('Image source path'),
  alt: z.string().describe('Accessible alt text'),
  caption: z.string().optional().describe('Image caption'),
}).describe('Hero image');

export const heroSchema = z.object({
  headline: z.string().describe('Main H1, benefit-focused'),
  subheadline: z.string().describe('Supporting context'),
  value_prop: z.string().describe('1-2 sentence hook explaining why this matters'),
  image: heroImageSchema.optional().describe('Hero image'),
  stats: z.array(heroStatSchema).max(3).optional().describe('Quick proof points'),
}).describe('Playbook hero section');

export const beforeAfterSchema = z.object({
  before: z.object({
    title: z.string().describe('Before state title'),
    pain_points: z.array(z.string()).describe('Pain points in before state'),
  }).describe('Before state'),
  after: z.object({
    title: z.string().describe('After state title'),
    benefits: z.array(z.string()).describe('Benefits in after state'),
  }).describe('After state'),
}).describe('Before/after comparison for motivation');

// ---------------------------------------------------------------------------
// FAQ Schema
// ---------------------------------------------------------------------------

export const faqItemSchema = z.object({
  question: z.string().describe('FAQ question'),
  answer: z.string().describe('FAQ answer (supports markdown)'),
}).describe('FAQ question/answer pair');

// ---------------------------------------------------------------------------
// Person Schema (for routines/stacks)
// ---------------------------------------------------------------------------

export const personLinksSchema = z.object({
  website: z.string().url().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
}).describe('Person social/web links');

export const personSchema = z.object({
  name: z.string().describe('Person name'),
  title: z.string().optional().describe('Job title'),
  company: z.string().optional().describe('Company name'),
  image: z.string().optional().describe('Portrait image path'),
  bio: z.string().optional().describe('2-3 sentence intro'),
  credentials: z.array(z.string()).optional().describe('Authority-establishing bullet points'),
  links: personLinksSchema.optional().describe('Social/web links'),
}).describe('Person for person-centric content');

// ---------------------------------------------------------------------------
// Reference Schema
// ---------------------------------------------------------------------------

export const referenceSchema = z.object({
  title: z.string().describe('Reference title'),
  url: z.string().url().describe('Reference URL'),
  source: z.string().optional().describe('Source publication'),
}).describe('Source or further reading');

// ---------------------------------------------------------------------------
// Delegation Metadata Schema
// ---------------------------------------------------------------------------

export const delegationSchema = z.object({
  pathway: z.enum([
    'direct-defensive',
    'direct-offensive',
    'vicarious-defensive',
    'vicarious-offensive',
  ]).optional().describe('Delegation pathway type'),
  modality: z.enum([
    'ad-hoc',
    'process-driven',
    'goal-driven',
    'clairvoyant',
  ]).optional().describe('Delegation modality'),
  frequency: z.enum(['one-time', 'recurring']).optional().describe('Task frequency'),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().describe('EA skill level required'),
}).describe('Delegation classification metadata');

// ---------------------------------------------------------------------------
// Meta Schema
// ---------------------------------------------------------------------------

export const metaSchema = z.object({
  title: z.string().max(70).describe('SEO-friendly title'),
  slug: z.string().regex(/^[a-z0-9-]+$/).describe('URL slug'),
  description: z.string().min(50).describe('Meta description for SEO'),
  area: areaEnum.describe('Life/work area classification'),
  type: contentTypeEnum.describe('Content type'),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft').describe('Publication status'),
  optimized_for: z.array(z.string()).min(3).max(5).optional().describe('Optimization tags'),
  complexity: z.number().int().min(1).max(10).optional().describe('Complexity score 1-10'),
  scope: z.number().int().min(1).max(10).optional().describe('Scope score 1-10'),
  intimacy: z.number().int().min(1).max(10).optional().describe('Intimacy score 1-10'),
  time_savings: z.string().optional().describe('Estimated time savings'),
  delegation: delegationSchema.optional().describe('Delegation classification'),
}).describe('Playbook metadata');

// ---------------------------------------------------------------------------
// Full Playbook Schema
// ---------------------------------------------------------------------------

export const playbookSchema = z.object({
  meta: metaSchema.describe('Playbook metadata and frontmatter'),
  hero: heroSchema.describe('Hero section content'),
  person: personSchema.optional().describe('Person info for routines/stacks'),
  tools: z.array(toolSchema).optional().describe('Tools used in this playbook'),
  templates: z.array(templateSchema).optional().describe('Downloadable templates'),
  before_after: beforeAfterSchema.optional().describe('Before/after comparison'),
  sections: z.array(sectionSchema).min(1).describe('Main content sections'),
  faq: z.array(faqItemSchema).min(3).max(8).describe('FAQ section for SEO'),
  references: z.array(referenceSchema).optional().describe('Sources and further reading'),
  related: z.array(z.string()).max(6).optional().describe('Related playbook slugs'),
}).describe('Complete Athena playbook');

export type Playbook = z.infer<typeof playbookSchema>;
