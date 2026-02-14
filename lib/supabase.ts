import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://kmahhxniyrbzhlvtkyas.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttYWhoeG5peXJiemhsdnRreWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODg0NzAsImV4cCI6MjA4NjU2NDQ3MH0.CQcu5qwgoBtfsmbzApdd-ig2O7aXhVKTakQJDAUU9Xo";

export const supabase = createClient(supabaseUrl, supabaseKey);
