// backend/config/supabase.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL and Service Key are required in environment variables"
  );
}

// Basic sanity check: ensure the server key looks like a service_role key
if (!supabaseKey.startsWith("service_role.")) {
  console.warn(
    "Warning: SUPABASE_SERVICE_KEY does not appear to be a service_role key. Server-side admin operations may fail."
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

module.exports = supabase;
