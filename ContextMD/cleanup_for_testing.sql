-- Cleanup Users for Testing
-- This deletes the specific users found in logs so you can register them again cleanly.

DELETE FROM auth.users WHERE id IN (
    'da4204b7-4432-4bfb-b3ab-a662517873e0', -- Previous User
    'fcac215f-d04b-4ff9-bc82-8a80b19852d0', -- Current Broken User
    '3716b0f4-c181-4b0a-afea-f227ba971e97'  -- Another previous ID
);

-- Also delete by email if you use a consistent test email
-- DELETE FROM auth.users WHERE email = 'your_test_email@gmail.com';
