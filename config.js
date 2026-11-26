// Public settings. The anon key is safe to be public: the database rules decide what it can see.
window.SDX_CONFIG = {
  SUPABASE_URL: "https://hvjxmchjuwgpvkqmbosf.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anhtY2hqdXdncHZrcW1ib3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0OTUxMTcsImV4cCI6MjExMDA3MTExN30.p6bHbrPwGllgBNvskzEqvENoH2wrXUISvH3_m4E1oSM",
  TELEGRAM_BOT: "SDXtradeFeedbot",
  AUTH_URL: "https://sdxtradefeed.onrender.com",
  ELITE_PACK_URL: "https://www.sdxtrading.education/",
  // Your Calendly booking page, e.g. "https://calendly.com/sdx/1-1-call". Leave empty to use the times you add in Admin.
  CALENDLY_URL: "",
  // Who Elite members can book a 1-1 call with
  // image: a picture for each card (put the file in the dashboard folder, e.g. "call-sam.jpg"). Leave empty for the silver card.
  CALL_HOSTS: [
    { key: "sam", name: "Sam", image: "call-sam.jpg", blurb: "Go through your trading, your entries and your plan with me, one to one." },
    { key: "harley", name: "Harley", image: "call-harley.jpg", blurb: "Go through your trading and your questions with Harley, one to one." }
  ],
  // Only these logins see the Mech Model groups on the Trade Service page
  OWNER_EMAILS: ["samdouglas@sdtradingeducation.com"]
};
