---
name: "Client Context Extraction via LLMs Project | Athena"
source_url: "https://docs.google.com/spreadsheets/d/1WXZBTeFgz9viG5-K41AR2E4oMrCNJGTSFQAXYEk3iYA/edit"
export_date: "2026-01-30T17:22:02.765Z"
type: "google_sheet"
export_format: "structured_markdown"
sheet_count: 2
---

# Client Context Extraction via LLMs Project | Athena

## Context Areas

### 1

**Short Name:** Logins & Accounts
**Description:** Active SaaS apps, financial/ecomm/travel accounts, etc for EA to get access to in 1Password
**Value / 10:** 8
**Difficulty / 10:** 3
**Score:** 27
**Data Sources:** Email, password manager

---

### 2

**Short Name:** Gifts
**Description:** Past gift recipients and purchases
**Value / 10:** 6
**Difficulty / 10:** 3
**Score:** 20
**Data Sources:** Email

---

### 3

**Short Name:** Preferences
**Description:** Basic set of preferences (e.g. flights, hotels, food ordering)
**Value / 10:** 8
**Difficulty / 10:** 5
**Score:** 16
**Data Sources:** Email, calendar, credit card transactions

---

### 4

**Short Name:** Data & Logistics
**Description:** Logistical data points like client address, company address, tax IDs (e.g. EINs), and other data points used in delegations
**Value / 10:** 5
**Difficulty / 10:** 4
**Score:** 13
**Data Sources:** Email, password manager, files

---

### 5

**Short Name:** Calendar
**Description:** Time preferences or schedule patterns
**Value / 10:** 5
**Difficulty / 10:** 4
**Score:** 13
**Data Sources:** Calendar

---

### 6

**Short Name:** Key Contacts
**Description:** Stakeholders (e.g. investors, closest colleagues, etc)
**Value / 10:** 6
**Difficulty / 10:** 5
**Score:** 12
**Data Sources:** Email, calendar, HRIS

---

### 7

**Short Name:** Loyalty Numbers
**Description:** Frequent flyer, hotel loyalty, and other program ID numbers
**Value / 10:** 3
**Difficulty / 10:** 3
**Score:** 10
**Data Sources:** Email, password manager

---

### 8

**Short Name:** Vendors
**Description:** Key vendors (e.g. attorney, accountant, for business; massuuse, housekeeper, or nanny for personal, etc; also locations like client gym, spa, favorite cafes, etc)
**Value / 10:** 6
**Difficulty / 10:** 6
**Score:** 10
**Data Sources:** Email, calendar, credit card transactions

---

### 9

**Short Name:** Delegations
**Description:** Potentially delegatable tasks or responsibility areas (i.e. from email threads of X length/replies)
**Value / 10:** 7
**Difficulty / 10:** 7
**Score:** 10
**Data Sources:** Email, calendar, credit card transactions

---

### 10

**Short Name:** Org Chart
**Description:** Potential collaborators within company (e.g. employees the EA may coordinate with on company delegations)
**Value / 10:** 3
**Difficulty / 10:** 4
**Score:** 8
**Data Sources:** Email, calendar, HRIS

---

### 11

**Short Name:** Interests
**Description:** Client interests (e.g. purchased books, subscribed newsletters, etc)
**Value / 10:** 2
**Difficulty / 10:** 4
**Score:** 5
**Data Sources:** Email, Amazon, social media

---



## Gmail Queries

### 1

**Key People, Current Priorities:** Reservations & Purchases
**from:me:** category:reservations OR category:purchases
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - useful start! - returns flights - misses Uber - returns Amazon package delivery notifications (which are useless)
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns flight confirmations and updates (delays, cancellations, etc) - returns payment confirmations (food, shopping, subscriptions) - returns shipping/delivery updates - returns hotel reservations - FYI, emails from jws.list and finance@jkfo are being forwarded to this email
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - pulled up only 3 emails (we usually use our family office's email for reservations and purchases) - returns restaurant reservation - returns list of restaurant recos
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - returns flight confirmations and updates (delays, cancellations, etc) - returns payment confirmations (food, shopping, subscriptions) - returns shipping/delivery updates - returns hotel reservations - FYI, emails from jws.list are being forwarded to J's personal email

---

### 2

**Key People, Current Priorities:** "Find Subscriptions"
**from:me:** (     subject:(subscription OR subscribe OR "recurring charge" OR "automatic renewal" OR invoice OR receipt OR billing OR "membership renewal" OR "subscription confirmation" OR "payment confirmation" OR "auto-debit" OR "direct debit" OR "charge statement" OR "billing statement" OR "account statement" OR "account charge" OR "service renewal")     OR "monthly charge" OR "annual charge" OR "renewal notice" OR "thank you for subscribing" OR "order confirmation" OR "subscription active" OR "renewal confirmation" OR "payment processed" OR "payment successful" OR "membership fee" OR "auto-renewal notice" OR "subscription fee" OR "billing update" )
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns newsletters - subscriptions - receipts/invoices from subscriptions - payment confirmations (food, shopping, subscriptions) - flight confirmations and updates (delays, cancellations, etc) - hotel reservations - promotional emails - emails from car rentals - spam - newsletter invites from LinkedIn
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - returns newsletters - Athena-related invoices - subscription confirmations/invitations - random application letters
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - returns newsletters - subscriptions - payment confirmations (shopping, subscriptions) - flight confirmations and updates (delays, cancellations, etc) - hotel reservations - promotional emails - emails from car rentals - spam

---

### 3

**Key People, Current Priorities:** Flight Patterns & Preferences
**from:me:** ( ("flight confirmation" OR "flight itinerary" OR "boarding pass" OR "seat assignment" OR "travel itinerary" OR "ticket number" OR "e-ticket" OR "gate information" OR "flight update" OR "travel confirmation" OR "check-in reminder") OR ("booking confirmation" OR "hotel reservation" OR "booking details" OR "reservation number" OR "check-in date") OR ("Uber receipt" OR "Lyft receipt" OR "ride summary" OR "ride receipt" OR "driver details" OR "trip details" OR "fare breakdown") OR ("Airbnb reservation" OR "Vrbo booking" OR "rental confirmation" OR "rental details" OR "host contact" OR "check-in instructions" OR "property reservation") ) OR ( ( (from:*uber.com OR from:*lyft.com OR from:*airbnb.com OR from:*vrbo.com) OR (from:*booking.com OR from:*expedia* OR from:*tripadvisor.com) OR (from:*delta.com OR from:*aa.com OR from:*united.com OR from:*southwest.com OR from:*jetblue.com OR from:*ba.com OR from:*lufthansa* OR from:*airfrance* OR from:*emirates* OR from:*singaporeair* OR from:*qantas* OR from:*ryanair* OR from:*easyjet* OR from:*ana.co.jp OR from:*aircanada* OR from:*alaskaair* OR from:*etihad* OR from:*airasia* OR from:*norwegian.com OR from:*koreanair* OR from:*cathaypacific*) OR (from:*marriott* OR from:*hilton.com OR from:*hyatt* OR from:*ihg.com OR from:*accor.com) OR (from:*shangri-la* OR from:*fourseasons* OR from:*waldorfastoria* OR from:*ritzcarlton*) OR ("Star Alliance" OR "Oneworld" OR "SkyTeam" OR "Leading Hotels of the World" OR "Small Luxury Hotels of the World") ) AND -("unsubscribe") ) -category:social -category:promotions -category:updates -category:forums
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - 100 emails goes back 2.5 years – likely others have WAY more here, as I haven't traveled much recently
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns flights - Uber - Turo - hotels - spa bookings - newsletters from club membership - tax-related emails
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - pulled up 15 emails - returns itineraries
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - returns flights - Uber - Turo - hotels - restaurtant reservations

---

### 4

**Key People, Current Priorities:** "Logistics"
**from:me:** (     ("client address" OR "company address" OR "tax ID" OR "EIN" OR "employer identification number" OR "VAT number" OR "business number" OR "registration number" OR "postal address" OR "shipping address" OR "billing address" OR "office location" OR "corporate headquarters" OR "branch location" OR "delegate information" OR "contact details" OR "company details" OR "headquarters address" OR "business ID" OR "wire instructions" OR "routing number")     OR (subject:(address OR "tax identification" OR "business registration" OR delegation)) ) -category:social -category:promotions -category:updates -category:forums from:me
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - removing categories key here - "from:me" also helps eliminate a bunch of random false positives  - 100 emails goes back 5 years
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns emails asking for bank wire information/requests, mailing addresses, etc - hunting for email addresses - returns company updates - returns updates of investments - finance/tax-related emails - delegation emails
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - delegation emails (tips, playbooks, coaching, etc) - hunting for email addresses - mailing address requests - finance/tax-related emails
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** "No messages matched your search"

---

### 5

**Key People, Current Priorities:** Calendar Events (Virtual & Digital)
**from:me:** (     (from:*calendar.google.com OR from:*calendly.com OR from:*doodle.com OR from:*invite@zoom.us OR from:*notifications@webex.com OR from:*noreply@teams.microsoft.com OR from:*eventbrite.com OR from:*ticketmaster.com OR from:*meetup.com OR from:*eventzilla.net OR from:*universe.com OR from:*splashthat.com OR from:*peatevent.com)     OR subject:(invitation OR invite OR meeting OR webinar OR event OR appointment OR conference)     OR ("MEETING RECAP" OR "meeting invitation" OR "calendar invite" OR "event invitation" OR "webinar registration" OR "appointment confirmation" OR "RSVP" OR "scheduled event" OR "join meeting" OR "event details" OR "add to your calendar" OR "meeting confirmation" OR "workshop invite" OR "conference call" OR "zoom link" OR "teams meeting" OR "google meet" OR "outlook calendar" OR "save the date" OR "parking instructions" OR "venue details" OR "entry ticket") ) -category:social -category:promotions -category:updates -category:forums -"unsubscribe"
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - 100 emails takes me back 1 month – figure 1000 / year – many clients probably have much higher meeting density, maybe 5X?  Looks like a couple bucks worth of haiku to process all this
**- returns emails with family members
- investment opportunities
- investor / company updates:** - invites to events, parties, webinars, etc. - calendar and Zoom/Google Meet invites - intro emails - appointment confirmations
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - calendar invites for in-person and Zoom meetings - Athena webinars
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - invites to events, webinars

---

### 6

**Key People, Current Priorities:** Vendors
**from:me:** ( ("can you help" OR "could you assist") OR ("closing books" OR "month end" OR "tax preparation" OR "massage" OR "house cleaning" OR "childcare" OR "take the kids" OR "personal training" OR "haircut" OR "facial" OR "manicure" OR "pedicure" OR  "therapy" OR chiropractor OR "physical therapy") OR ("attorney at law" OR "Certified Public Accountant" OR "licensed professional" OR "license number:" OR "member of" OR "bar number" OR "certification number" OR "licensed in" OR "registration number" OR "practice number" OR "DUNS number" OR "credentials include" OR "accredited by") ) -category:social -category:promotions -category:updates -category:forums -"unsubscribe"  from:me
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - this one really isn't working for me, but I think that's because I live a relatively simple life and don't deal with all that much of this stuff...
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns emails with financial advisor - returns emails with referrals (investors, lawyers, health-related, insurance, accountants, etc)  - there were just a few of these emails in the first result page (1-100)
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - returns mostly team emails asking for help on a task, intros, meeting requests, etc. - returns email to Fireflies and Superhuman re discounts  - there were just a few of these emails in the first result page (1-50)
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - pulled up 4 emails - flight purchase confirmations - email with customer support

---

### 7

**Key People, Current Priorities:** Gifts
**from:me:** (     ("Happy Birthday" OR "Happy Anniversary" OR "Happy Mother's Day" OR "Merry Christmas" OR "Happy Father's Day" OR "Happy Valentine's Day" OR "Season's Greetings" OR "Gift for You" OR "Surprise for You" OR "token of appreciation" OR "token of my appreciation" OR "token of our appreciation" OR "hope you like it" OR "hope you enjoy")     OR ("gift card" OR "e-gift card" OR "gift certificate" OR "gift voucher" OR "digital gift" OR "Amazon gift" OR "iTunes gift" OR "Steam gift" OR "e-card" OR "gift receipt" OR "gift delivery" OR "gift shipment" OR "special delivery" OR "your order has shipped" OR "card message" OR "gift message")     OR subject:(gift OR present OR gifting OR "gift order" OR "gift purchase" OR "gift receipt") ) -category:social -category:promotions -category:updates -category:forums
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - this one basically doesn't work for me, though I'm a woefully infrequent gift giver, so perhaps it still adds value
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns emails with instructions to purchase gifts - returns greetings (birthday, Christmas, Father's Day, etc) - returns donation receipts - thank you emails - gift ideas - returns outreach emails with holiday greetings
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - returns emails with Google Slides - thank you emails - investor emails - greetings (birthday, Christmas) - returns gift vouchers
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - returns promotional emails

---

### 8

**Key People, Current Priorities:** Meeting recaps
**from:me:** (     ("meeting recap" OR "meeting summary" OR "meeting notes" OR "session notes" OR "discussion recap" OR "meeting minutes" OR "meeting outcomes" OR "action items" OR "meeting follow-up")         OR (from:*fireflies.ai OR from:*otter.ai OR from:*getnotified.com OR from:*meetgeek.ai OR from:*nora.team OR from:*airgram.io OR from:*noota.io OR from:*rewind.ai OR from:*getpattern.ai OR from:*grain.com OR from:*krisp.ai OR from:*meetgeek.ai OR from:*capture.so OR from:*get.mem.ai OR from:*update.ai) ) -category:social -category:promotions -category:updates -category:forums -"unsubscribe"
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - this works reasonably well for me, though I suspect it may break for others still – either because I'm missing their notetaker (not sure how MS Teams sends these), or because they overload some of these phrases
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns pitch decks, company updates - reading materials for board meetings - returns Fireflies - appointment notifications - meetings notes and summaries - action items
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - returns pitch decks, investor updates - meetings notes and action items - follow ups
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - returns newsletters - majority of the results were from 2016

---

### 9

**Key People, Current Priorities:** Financial Services
**from:me:** (     ("monthly statement" OR "your statement is ready" OR "account summary" OR "transaction summary" OR "financial statement" OR "account update" OR "balance update" OR "investment update" OR "portfolio summary" OR "payment is due" OR "your credit card" OR "your debit card")     OR (from:*chase.com OR from:*bankofamerica.com OR from:*wellsfargo.com OR from:*citi.com OR from:*usbank.com OR from:*pnc.com OR from:*capitalone.com OR from:*td.com OR from:*schwab.com OR from:*fidelity.com OR from:*vanguard.com OR from:*etrade.com OR from:*ameritrade.com OR from:*goldmansachs.com OR from:*morganstanley.com OR from:*ally.com OR from:*discover.com OR from:*synchronybank.com OR from:*amex.com OR from:*barclays.com OR from:*tiaa.com OR from:*statestreet.com OR from:*bbt.com OR from:*suntrust.com OR from:*charlesschwab.com OR from:*hsbc.com OR from:*bnymellon.com OR from:*sofi.com OR from:*robinhood.com OR from:*paypal.com OR from:*creditkarma.com OR from:*mint.com OR from:*betterment.com OR from:*wealthfront.com OR from:*acorns.com OR from:*stash.com OR from:*robinhood.com OR from:*usaa.com OR from:*merrilledge.com OR from:*salliemae.com OR from:*navyfederal.org OR from:*regions.com OR from:*53.com OR from:*bmo.com OR from:*huntington.com OR from:*key.com) ) -category:social -category:promotions -category:updates -category:forums -"unsubscribe"
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - works well for me –
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns monthly statements - daily bank account summaries, wire notifications - Amazon account updates - tax filings - payment deadlines
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - Athena finance updates - Athena Client invoices (from 2021) - purchase confirmations
**- returns forwarded emails to EA on flights, car rentals, hotels, etc
- promotional emails:** - majority of the emails are over 6 years old - returns Amazon account updates - autopay reminders - failed payment notifications

---

### 10

**Key People, Current Priorities:** Task Management
**from:me:** (     ("mentioned you" OR "task assigned to you" OR "you have been assigned a task" OR "new task assigned" OR "task update" OR "you are mentioned" OR "action required by you" OR "task completion" OR "update on task" OR "project update" OR "mention you in a comment" OR "added you to a task" OR "assigned to you")     OR (from:drive-shares-dm-noreply@google.com OR from:*docs.google.com OR from:*monday.com OR from:*atlassian.net OR from:*clickup.com OR from:*github.com OR from:*trello.com OR from:*asana.com OR from:*basecamp.com OR from:*smartsheet.com OR from:*wrike.com OR from:*slack.com OR from:*microsoft.com OR from:*zoho.com OR from:*airtable.com OR from:*notion.so OR from:*podio.com OR from:*teamwork.com OR from:*workfront.com OR from:*bitrix24.com OR from:*proofhub.com OR from:*zenkit.com OR from:*meistertask.com OR from:*todoist.com OR from:*nifty.pm OR from:*kintone.com OR from:*clickup.com OR from:*quip.com OR from:*redbooth.com OR from:*hive.com OR from:*flock.com OR from:*clarizen.com OR from:*taskworld.com OR from:*freedcamp.com OR from:*scoro.com OR from:*paymoapp.com OR from:*flowapp.com OR from:*projectmanager.com OR from:*teambition.com OR from:*liquidplanner.com OR from:*droptask.com OR from:*getflow.com OR from:*avaza.com OR from:*activecollab.com OR from:*plutio.com OR from:*proprofs.com OR from:*ryver.com OR from:*workzone.com OR from:*kanbantool.com) ) -category:social -category:forums
**- starting with the emails that the person has recently sent gives us a pretty good sense of what they are up to 
- we can get (at least some) key people by looking back at the last 1000 emails sent and counting how many are sent to each person:** - whether to use "-unsubscribe" in this one is a bit tricky.  If I use it, I lose a lot of stuff.  If I don't use it, for me, the results are dominated by Github issues which aren't super relevant, though they aren't irrelevant either...
**- returns emails with family members
- investment opportunities
- investor / company updates:** - returns files shared with Jonathan (Sheets, Documents, Slides, etc) - share requests + mentioned comments - account activity from Microsoft, Notion
**- returns Athena CTO hunt (intros, candidates, meetups)
- Athena client waitlist
- investor intros:** - returns files shared with Jonathan (Sheets, Documents, Slides, etc) - share requests + mentioned comments - account activity from Notion, HubSpot, Asana

---

