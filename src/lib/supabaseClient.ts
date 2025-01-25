// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://hyaocbmqcrtqyhfwypci.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YW9jYm1xY3J0cXloZnd5cGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0Mjg4OTUsImV4cCI6MjA1MzAwNDg5NX0.fc4IdicgAMemJaSvdOt5MmVGJ93jinx1yUKExbvsKZ0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);