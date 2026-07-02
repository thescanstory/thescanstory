-- Demo products for local dev / MVP walkthrough.
-- Prices are in paise (₹1 = 100 paise) to match Razorpay's amount unit.

insert into products (name, type, price_paise, description, image_url) values
  ('Personalized Photo Frame', 'frame', 129900, 'A printed photo frame that plays a hidden video message when scanned.', '/placeholder-frame.svg'),
  ('Wallet Story Card', 'wallet_card', 59900, 'A pocket-sized card that comes to life with your story.', '/placeholder-walletcard.svg'),
  ('Story T-Shirt', 'tshirt', 89900, 'Wear a printed photo that plays your message when scanned.', '/placeholder-tshirt.svg');
