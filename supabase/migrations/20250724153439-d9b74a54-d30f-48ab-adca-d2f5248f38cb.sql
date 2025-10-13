-- Fix data where phone field contains birth date and move it to birth_date field
UPDATE profiles 
SET 
  birth_date = phone::date,
  phone = NULL
WHERE phone ~ '^\d{4}-\d{2}-\d{2}$';