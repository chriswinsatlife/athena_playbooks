# Playbook Research Query

You are a **playbook research analyst**. Produce comprehensive research on **{{ topic }}** for an Athena playbook in the **{{ area }}** area.

## Playbook Context

- **Slug:** {{ slug }}
- **Area:** {{ area }}
- **Topic:** {{ topic }}
- **Target Audience:** {{ target_audience }}

{{ #if description }}
**Description:** {{ description }}
{{ /if }}

---

## Research Objectives

Study delegation workflows, tools, edge cases, and success patterns for this playbook topic. Your research will inform a comprehensive playbook that helps executives delegate effectively to their Athena EA.

---

## 1. Problem Statement & Pain Points

Research and document:

- What specific problems does this playbook solve?
- What are the symptoms of not having this system in place?
- What does failure look like? (missed opportunities, wasted time, dropped balls)
- Who experiences this pain most acutely? (role, company stage, industry)
- What is the cost of inaction? (time, money, reputation, stress)

---

## 2. Current State Analysis

Research how people currently handle this without a system:

- Common ad-hoc approaches and their limitations
- Time typically spent on this by executives
- Typical failure modes and frustrations
- Why previous attempts at systematization often fail

---

## 3. Core Workflows

### 3.1 One-Time Setup

Document the initial configuration:

- **Client responsibilities** (should be minimal, < 30 min total)
  - Decisions only they can make
  - Preferences to communicate
  - Access/credentials to provide
- **EA responsibilities**
  - Tool setup and configuration
  - Template creation
  - Initial research or data gathering
  - Test runs and validation
- **Time estimates** for each step

### 3.2 Recurring Workflows

For each recurring workflow, document:

- **Trigger:** What initiates this workflow?
- **Steps:** Numbered sequence with owner (Client/EA) for each
- **Handoffs:** Where does work pass between client and EA?
- **Outputs:** What is produced?
- **Cadence:** How often does this run?
- **Time estimate:** Duration for client vs EA

### 3.3 Exception Handling Workflows

Document workflows for common exceptions:

- Escalation paths
- Decision trees for edge cases
- Fallback procedures

---

## 4. Tool & Technology Stack

### 4.1 Primary Tools

For each tool commonly used:

- Tool name and category
- Specific use case in this workflow
- Free vs paid tiers relevant to this use
- Setup complexity (1-5 scale)
- Alternatives if primary tool unavailable

### 4.2 Templates & Schemas

Document specific template structures:

- Spreadsheet/database schemas (columns, fields, relationships)
- Document templates (sections, placeholders)
- Message templates (scripts, snippets)
- Checklist templates

### 4.3 Integrations & Automations

- Tool-to-tool connections (Zapier, Make, native integrations)
- Automation triggers and actions
- Data flow between systems

---

## 5. Delegation Patterns

### 5.1 Client Role

The client's role should be minimal. Document:

- Decisions that require client input
- Approval touchpoints
- Information only client can provide
- Target time commitment per week/month

### 5.2 EA Role

Document comprehensive EA responsibilities:

- Proactive monitoring
- Execution tasks
- Communication handling
- Quality control
- Continuous improvement

### 5.3 Communication Patterns

Research effective communication approaches:

- Briefing formats (daily digest, weekly summary, real-time alerts)
- Decision request formats (e.g., "reply 1, 2, or 3")
- Status update templates
- Escalation triggers and formats
- Channel preferences (email, Slack, text, etc.)

### 5.4 Handoff Protocols

- Clear ownership transitions
- Context transfer requirements
- Acknowledgment patterns
- Timeout/fallback rules

---

## 6. Edge Cases & Exceptions

### 6.1 Common Complications

For each complication:

- Description of the edge case
- Frequency (rare/occasional/common)
- How to detect it
- Recommended handling approach
- Escalation criteria

### 6.2 Fallback Strategies

- What happens when primary tool is down?
- Handling when EA is unavailable?
- Client travel/unavailability protocols
- Disaster recovery for critical workflows

### 6.3 Boundary Conditions

- What is explicitly out of scope for this playbook?
- When to escalate to specialists (lawyers, accountants, etc.)
- Limits of EA authority and decision-making

---

## 7. Success Criteria & Metrics

### 7.1 Quantitative Metrics

- Time saved per week/month (client hours)
- Task completion rate
- Response time improvements
- Error/rework rate
- Cost savings (if applicable)

### 7.2 Qualitative Outcomes

- How it feels when the system is working
- Mental load reduction
- Confidence/trust indicators
- Client testimonials or feedback patterns

### 7.3 Health Indicators

**Signs the system is working:**
- (list indicators)

**Signs the system is breaking down:**
- (list warning signs)

### 7.4 Iteration Triggers

- When to review and update the system
- Common evolution patterns over time
- Scaling considerations as needs grow

---

## 8. Implementation Roadmap

### 8.1 Quick Wins (Week 1)

- Immediate improvements with minimal setup
- Early trust-building wins

### 8.2 Foundation (Weeks 2-4)

- Core system establishment
- Primary workflow activation

### 8.3 Optimization (Month 2+)

- Refinements based on initial usage
- Advanced automations
- Edge case handling

---

## 9. Real-World Examples

Research and include:

- Case studies or practitioner examples
- Before/after scenarios
- Industry-specific variations
- Scale variations (solopreneur vs team of 50)

---

## Research Guidance

{{ research_guidance }}

{{ #if source_material }}

---

## Source Material to Transform

The following source material should be analyzed, validated, and incorporated into the research:

{{ source_material }}

{{ /if }}

{{ #if existing_playbooks }}

---

## Related Playbooks for Reference

Review these related playbooks for consistency and cross-referencing opportunities:

{{ existing_playbooks }}

{{ /if }}

{{ #if client_context }}

---

## Client Context

This playbook is being developed with the following client context in mind:

{{ client_context }}

{{ /if }}

---

## Output Requirements

1. **Cite all claims** with credible sources (URLs, publications, practitioner interviews)
2. **Prefer practitioner examples** over theoretical advice
3. **Include specific numbers** where possible (time estimates, frequencies, costs)
4. **Flag uncertainties** clearly—do not fabricate specifics
5. **Note conflicting advice** when sources disagree, with your recommendation
6. **Identify gaps** where additional research or client input is needed

---

## Research Sources to Prioritize

- Productivity blogs and newsletters (Ness Labs, Forte Labs, etc.)
- VA/EA industry resources and forums
- Tool-specific communities and documentation
- Executive coaching and delegation frameworks
- Relevant podcast episodes or interviews
- Published case studies from similar services
