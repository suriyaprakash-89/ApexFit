// backend/config/supabase.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase URL and Service Key are required in environment variables",
  );
}

// Sanity check: the server needs the secret service_role key (a JWT with
// role "service_role", or a new-style "sb_secret_..." key), never the anon/publishable key.
const looksLikeServiceKey = (key) => {
  if (key.startsWith("sb_secret_")) return true;
  if (key.startsWith("sb_publishable_")) return false;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    return payload.role === "service_role";
  } catch {
    return false;
  }
};

if (!looksLikeServiceKey(supabaseKey)) {
  console.warn(
    "Warning: SUPABASE_SERVICE_KEY is not a service_role/secret key. Account deletion, AI history and other server-side operations will fail.",
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = supabase;
