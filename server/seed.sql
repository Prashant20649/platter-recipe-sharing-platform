-- Platter Seed Data
USE platter;

-- Disable foreign key checks for clean truncation/population
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE collection_items;
TRUNCATE TABLE collections;
TRUNCATE TABLE view_history;
TRUNCATE TABLE user_favorites;
TRUNCATE TABLE reviews;
TRUNCATE TABLE messages;
TRUNCATE TABLE recipe_instructions;
TRUNCATE TABLE recipe_ingredients;
TRUNCATE TABLE recipes;
TRUNCATE TABLE users;
TRUNCATE TABLE settings;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Initial System Settings
INSERT INTO settings (id, site_name, require_approval, allow_reviews, max_ingredients, maintenance_mode)
VALUES (1, 'Platter', TRUE, TRUE, 25, FALSE);

-- 2. Seed Users (1 Admin, 2 Contributors, 1 Explorer)
-- Passwords:
-- admin@platter.com / admin123
-- chef.mario@platter.com / chef123
-- chef.julia@platter.com / chef123
-- explorer.sam@platter.com / explorer123
INSERT INTO users (id, name, email, password, role, bio, avatar) VALUES
(1, 'Admin Alex', 'admin@platter.com', '$2a$10$pKsBsCZsG2OhgBSxRVRV5O/x0Vp4Yzd/wr/TflGx4g3usPwDOPXrW', 'admin', 'Platform administrator keeping Platter delicious, safe, and organized.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'),
(2, 'Chef Mario Rossi', 'chef.mario@platter.com', '$2a$10$4Xm0uc.QjcGt6vZzGaS3xupslY1F13IkH.G3tWaPZOvLZmNAM15le', 'contributor', 'Italian culinary master specializing in handmade pastas, rustic sourdoughs, and authentic Mediterranean flavors.', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80'),
(3, 'Chef Julia Chen', 'chef.julia@platter.com', '$2a$10$4Xm0uc.QjcGt6vZzGaS3xupslY1F13IkH.G3tWaPZOvLZmNAM15le', 'contributor', 'Pastry chef and Asian-fusion creator passionate about fresh plant-forward cooking and balanced savoriness.', 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=200&q=80'),
(4, 'Sam Walker', 'explorer.sam@platter.com', '$2a$10$AkOVCDalDMLTx5VrpF/7E.QjPwykG3CT6pUxjDQNRE8sI2DrYhVAO', 'explorer', 'Curious home cook, weekend baker, and avid recipe collector from Seattle.', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80');

-- 3. Seed Recipes
INSERT INTO recipes (id, title, description, cuisine, diet, prep_time, cook_time, total_time, servings, photo_url, author_id, status, average_rating, review_count, view_count) VALUES
(1, 'Authentic Neapolitan Margherita Pizza', 'Crisp yet tender blistered crust topped with crushed San Marzano tomatoes, fresh buffalo mozzarella, fragrant basil leaves, and cold-pressed extra virgin olive oil.', 'Italian', 'Vegetarian', 25, 10, 35, 4, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80', 2, 'approved', 5.0, 1, 142),
(2, 'Creamy Wild Mushroom Risotto', 'Slow-simmered Arborio rice with caramelized cremini, shiitake, and porcini mushrooms, finished with fragrant white wine, butter, and freshly grated Parmigiano-Reggiano.', 'Italian', 'Vegetarian', 15, 30, 45, 4, 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80', 2, 'approved', 5.0, 1, 98),
(3, 'Traditional Roman Spaghetti Alla Carbonara', 'The true Italian classic made strictly with crispy guanciale, rich farm egg yolks, sharp Pecorino Romano, and freshly cracked toasted black peppercorns.', 'Italian', 'Omnivore', 10, 15, 25, 2, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80', 2, 'approved', 4.0, 1, 215),
(4, 'Handmade Potato Gnocchi with Sage Brown Butter', 'Pillow-soft Italian potato dumplings tossed in nutty browned butter with crisp sage leaves and shaved aged pecorino cheese.', 'Italian', 'Vegetarian', 40, 15, 55, 4, 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', 2, 'pending', 0.0, 0, 18),
(5, 'Golden Crispy Tofu Pad Thai', 'Street-style stir-fried flat rice noodles with golden pressed tofu, crunchy bean sprouts, garlic chives, crushed peanuts, and a sweet-tangy homemade tamarind sauce.', 'Asian', 'Vegan', 20, 15, 35, 3, 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', 3, 'approved', 5.0, 1, 175),
(6, 'Spicy Szechuan Dan Dan Noodles', 'Springy wheat noodles bathed in a fiery chili oil, sesame paste, and toasted Szechuan peppercorn sauce, topped with seasoned minced mushrooms and bok choy.', 'Asian', 'Vegetarian', 20, 15, 35, 2, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80', 3, 'approved', 0.0, 0, 110),
(7, 'Matcha Glazed Brioche Donuts', 'Fluffy, cloud-like fried brioche donuts dipped in an aromatic Uji ceremonial matcha white chocolate glaze with edible rose petals.', 'French', 'Vegetarian', 45, 20, 65, 8, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', 3, 'approved', 0.0, 0, 88),
(8, 'Avocado & Mango Summer Rainbow Bowl', 'Vibrant coconut-infused jasmine rice bowl topped with diced ripe mango, creamy Hass avocado, edamame, cucumber ribbons, and a spicy ginger-lime dressing.', 'Asian', 'Vegan', 20, 15, 35, 2, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', 3, 'pending', 0.0, 0, 14),
(9, 'Fire-Roasted Chicken Tinga Tacos', 'Shredded chicken simmered in a smoky chipotle-tomato sauce, piled onto warm corn tortillas with diced white onion, fresh cilantro, crumbled cotija, and lime.', 'Mexican', 'Omnivore', 15, 25, 40, 4, 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', 2, 'approved', 5.0, 1, 160),
(10, 'Zesty Mediterranean Quinoa Salad', 'Fluffy protein-rich quinoa tossed with crisp Persian cucumbers, sweet cherry tomatoes, Kalamata olives, toasted pine nuts, fresh mint, and lemon-herb vinaigrette.', 'Mediterranean', 'Vegan', 15, 15, 30, 4, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', 3, 'approved', 0.0, 0, 130);

-- 4. Recipe Ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient, item_order) VALUES
-- Recipe 1: Margherita Pizza
(1, '500g Tipo 00 flour', 1),
(1, '325ml lukewarm water', 2),
(1, '10g fine sea salt', 3),
(1, '3g active dry yeast', 4),
(1, '400g canned San Marzano whole peeled tomatoes', 5),
(1, '250g fresh buffalo mozzarella sliced', 6),
(1, 'Fresh basil leaves', 7),
(1, '2 tbsp extra virgin olive oil', 8),

-- Recipe 2: Wild Mushroom Risotto
(2, '320g Carnaroli or Arborio rice', 1),
(2, '300g mixed mushrooms (cremini, shiitake, oyster)', 2),
(2, '20g dried porcini mushrooms rehydrated in warm water', 3),
(2, '1.2 liters warm vegetable broth', 4),
(2, '1 medium shallot finely minced', 5),
(2, '120ml dry crisp white wine', 6),
(2, '50g unsalted butter cold and cubed', 7),
(2, '60g Parmigiano-Reggiano aged 24 months', 8),
(2, 'Fresh thyme leaves & cracked black pepper', 9),

-- Recipe 3: Carbonara
(3, '220g bronze-die spaghetti', 1),
(3, '120g cured guanciale diced into thick strips', 2),
(3, '4 large egg yolks + 1 whole egg', 3),
(3, '70g Pecorino Romano freshly grated', 4),
(3, '2 tsp freshly crushed black peppercorns', 5),
(3, 'Sea salt for pasta water', 6),

-- Recipe 4: Gnocchi
(4, '1kg Russet potatoes baked and riced', 1),
(4, '180g all-purpose flour', 2),
(4, '1 egg beaten', 3),
(4, '1 tsp fine sea salt', 4),
(4, '80g unsalted butter', 5),
(4, '15 fresh sage leaves', 6),
(4, 'Fresh nutmeg freshly grated', 7),

-- Recipe 5: Pad Thai
(5, '200g dried flat rice stick noodles', 1),
(5, '250g extra-firm tofu cubed', 2),
(5, '3 tbsp tamarind paste concentrate', 3),
(5, '3 tbsp coconut palm sugar', 4),
(5, '2 tbsp dark soy sauce + 2 tbsp light soy sauce', 5),
(5, '3 cloves garlic minced', 6),
(5, '2 shallots thinly sliced', 7),
(5, '150g fresh bean sprouts', 8),
(5, '4 stalks Chinese garlic chives chopped', 9),
(5, '50g roasted peanuts crushed', 10),
(5, 'Lime wedges & dried chili flakes', 11),

-- Recipe 6: Dan Dan Noodles
(6, '250g fresh Chinese wheat noodles', 1),
(6, '200g finely minced shiitake mushrooms', 2),
(6, '3 tbsp roasted sesame paste (or tahini)', 3),
(6, '3 tbsp red chili oil with chili flakes', 4),
(6, '2 tbsp Chinkiang black vinegar', 5),
(6, '2 tbsp light soy sauce', 6),
(6, '1 tsp ground toasted Szechuan peppercorn', 7),
(6, '3 cloves garlic grated', 8),
(6, '2 heads baby bok choy halved', 9),
(6, '2 scallions thinly sliced', 10),
(6, '2 tbsp Sui Mi Ya Cai (preserved mustard greens)', 11),

-- Recipe 7: Donuts
(7, '350g strong bread flour', 1),
(7, '45g caster sugar', 2),
(7, '7g instant yeast', 3),
(7, '3 large eggs at room temperature', 4),
(7, '120g softened unsalted butter', 5),
(7, '50ml whole milk warm', 6),
(7, '150g white chocolate melted', 7),
(7, '2 tbsp ceremonial grade matcha powder', 8),
(7, '50ml heavy cream', 9),
(7, 'Neutral oil for deep frying', 10),

-- Recipe 8: Rainbow Bowl
(8, '1 cup jasmine rice', 1),
(8, '1 cup coconut milk', 2),
(8, '1 ripe mango diced', 3),
(8, '1 Hass avocado sliced', 4),
(8, '1 cup shelled edamame steamed', 5),
(8, '1 English cucumber shaved into ribbons', 6),
(8, '2 tbsp toasted sesame seeds', 7),
(8, 'Juice of 2 limes', 8),
(8, '1 tbsp freshly grated ginger', 9),
(8, '2 tbsp tamari or coconut aminos', 10),

-- Recipe 9: Tinga Tacos
(9, '500g cooked chicken breast shredded', 1),
(9, '4 medium Roma tomatoes roasted', 2),
(9, '2-3 canned chipotle peppers in adobo sauce', 3),
(9, '1 medium white onion sliced', 4),
(9, '3 cloves garlic', 5),
(9, '1 tsp dried Mexican oregano', 6),
(9, '12 small white corn tortillas', 7),
(9, 'Fresh cilantro chopped', 8),
(9, '80g crumbled Cotija cheese', 9),
(9, 'Lime wedges', 10),

-- Recipe 10: Quinoa Salad
(10, '1 cup tri-color quinoa rinsed', 1),
(10, '2 cups water or vegetable broth', 2),
(10, '1 cup halved cherry tomatoes', 3),
(10, '2 Persian cucumbers diced', 4),
(10, '1/2 cup Kalamata olives pitted and halved', 5),
(10, '1/4 cup red onion finely minced', 6),
(10, '1/4 cup toasted pine nuts', 7),
(10, 'Fresh flat-leaf parsley and mint chopped', 8),
(10, '1/4 cup extra virgin olive oil', 9),
(10, 'Juice of 1 large lemon', 10),
(10, '1 tsp dried Greek oregano', 11);

-- 5. Recipe Instructions
INSERT INTO recipe_instructions (recipe_id, step_instruction, step_number) VALUES
-- Recipe 1: Margherita Pizza
(1, 'Dissolve yeast in lukewarm water. In a large mixing bowl, combine flour and salt, then gradually mix in yeast water until a shaggy dough forms.', 1),
(1, 'Knead dough by hand on a lightly floured surface for 10-12 minutes until smooth and elastic. Divide into 4 balls, cover, and ferment at room temperature for 8 hours.', 2),
(1, 'Preheat oven with a pizza stone or baking steel to its highest setting (usually 250-280°C / 500-550°F) for at least 45 minutes.', 3),
(1, 'Gently stretch dough from center outward on a floured peel, leaving an airy 1-inch border for the crust.', 4),
(1, 'Crush San Marzano tomatoes by hand with a pinch of salt and spoon evenly over dough.', 5),
(1, 'Tear buffalo mozzarella slices and scatter across the pizza. Drizzle with extra virgin olive oil.', 6),
(1, 'Bake for 7-9 minutes until crust is puffed and leopard-spotted with golden melted cheese. Top immediately with fresh basil.', 7),

-- Recipe 2: Wild Mushroom Risotto
(2, 'Heat olive oil in a wide heavy pan. Sauté sliced fresh mushrooms over high heat until browned and caramelized, about 6 minutes. Season and set aside.', 1),
(2, 'In the same pan, melt half the butter and sweat minced shallots gently until soft and translucent.', 2),
(2, 'Add Arborio rice and toast, stirring constantly for 2-3 minutes until edges become translucent.', 3),
(2, 'Pour in dry white wine and let it bubble away until almost completely absorbed.', 4),
(2, 'Begin adding warm vegetable broth one ladle at a time, stirring frequently and allowing liquid to absorb before adding the next ladle (approx. 18-20 minutes).', 5),
(2, 'Fold in sautéed mushrooms, rehydrated porcinis with strained mushroom liquor, and thyme.', 6),
(2, 'Remove from heat. Vigorously beat in cold cubed butter and grated Parmesan to create a creamy wave (mantecatura). Season with black pepper and serve warm.', 7),

-- Recipe 3: Carbonara
(3, 'Bring a pot of water to a boil and salt lightly. Cook spaghetti 2 minutes shy of al dente.', 1),
(3, 'In a cold skillet, add diced guanciale and turn heat to medium-low. Cook until fat renders and pork turns golden and crispy (about 8 minutes). Set aside pan off heat, reserving fat.', 2),
(3, 'In a bowl, whisk egg yolks, whole egg, grated Pecorino, and freshly toasted crushed black pepper until thick paste forms.', 3),
(3, 'Transfer hot spaghetti directly into the pan with warm guanciale fat, tossing with 1/4 cup starchy pasta cooking water.', 4),
(3, 'Remove skillet completely from heat. Pour egg and cheese mixture over pasta, stirring vigorously so residual heat cooks eggs into a glossy velvet emulsion without scrambling.', 5),
(3, 'Fold in crispy guanciale, top with extra pecorino and black pepper, and serve immediately.', 6),

-- Recipe 4: Gnocchi
(4, 'Bake whole russet potatoes at 200°C for 50 minutes until tender. Peel while warm and press through a potato ricer onto a clean board.', 1),
(4, 'Sprinkle with salt and flour, add beaten egg, and gently knead into a cohesive dough without overworking.', 2),
(4, 'Roll into 3/4-inch ropes and cut into 1-inch pillows. Roll gently over a gnocchi board or fork tines.', 3),
(4, 'Boil in salted water in batches; remove with a slotted spoon 1 minute after they float.', 4),
(4, 'In a skillet, melt butter over medium heat until it foams and turns fragrant light hazelnut brown. Fry sage leaves until crisp.', 5),
(4, 'Toss boiled gnocchi into brown butter, coat well, and finish with freshly grated cheese and nutmeg.', 6),

-- Recipe 5: Pad Thai
(5, 'Soak rice noodles in warm water for 30 minutes until pliable but still firm. Drain well.', 1),
(5, 'Whisk tamarind paste, palm sugar, soy sauces, and 2 tbsp water in a small bowl until sugar is dissolved.', 2),
(5, 'Heat 2 tbsp oil in a wok over high heat. Fry tofu cubes until crispy and golden on all sides. Push to side of wok.', 3),
(5, 'Add shallots and garlic, stir-fry 30 seconds until fragrant.', 4),
(5, 'Add drained noodles and pour sauce over. Toss vigorously on high heat for 2-3 minutes until noodles soften and absorb sauce.', 5),
(5, 'Toss in bean sprouts and garlic chives for 30 seconds until slightly wilted.', 6),
(5, 'Serve hot garnished with crushed peanuts, chili flakes, and lime wedges.', 7),

-- Recipe 6: Dan Dan Noodles
(6, 'In a skillet with 1 tbsp oil, stir-fry minced mushrooms and Ya Cai until browned and fragrant. Season with a dash of soy sauce.', 1),
(6, 'In two serving bowls, divide sesame paste, chili oil, soy sauce, black vinegar, Szechuan pepper, and grated garlic. Whisk with 3 tbsp hot noodle broth.', 2),
(6, 'Boil wheat noodles according to package instructions (about 3-4 minutes). Add baby bok choy during the last 45 seconds to blanch.', 3),
(6, 'Drain noodles and bok choy well, then divide between the two bowls over the sauce.', 4),
(6, 'Top with crispy seasoned mushrooms, crushed roasted peanuts, and sliced scallions. Toss thoroughly before eating!', 5),

-- Recipe 7: Donuts
(7, 'In a stand mixer, combine flour, yeast, sugar, salt, milk, and eggs. Knead for 8 minutes until smooth.', 1),
(7, 'Gradually add softened butter one tablespoon at a time while kneading until silky and elastic. Proof covered for 2 hours until doubled.', 2),
(7, 'Roll out dough to 1/2-inch thickness and cut into 3-inch rounds. Place on parchment squares and proof for another 45 minutes.', 3),
(7, 'Heat oil in a heavy Dutch oven to 175°C (350°F). Fry donuts 2 minutes per side until golden brown and cooked through. Drain on wire rack.', 4),
(7, 'Whisk warm cream, melted white chocolate, and sifted matcha powder until silky and vibrant green.', 5),
(7, 'Dip warm donut tops into glaze and allow to set. Garnish with edible flower petals.', 6),

-- Recipe 8: Rainbow Bowl
(8, 'Cook jasmine rice in coconut milk and 1/2 cup water with a pinch of salt until tender and fluffy.', 1),
(8, 'Whisk lime juice, grated ginger, tamari, and 1 tsp sesame oil in a small jar.', 2),
(8, 'Divide warm coconut rice into shallow bowls.', 3),
(8, 'Arrange diced mango, fan of sliced avocado, steamed edamame, and crisp cucumber ribbons around the bowl.', 4),
(8, 'Drizzle generously with ginger-lime dressing and sprinkle toasted sesame seeds on top.', 5),

-- Recipe 9: Tinga Tacos
(9, 'Broil whole tomatoes and garlic cloves until charred. Blend with chipotle peppers, 2 tbsp adobo sauce, oregano, and 1/2 cup chicken stock until smooth.', 1),
(9, 'Heat olive oil in a skillet, sauté sliced onions until soft and lightly golden.', 2),
(9, 'Pour blended chipotle sauce into the skillet and simmer for 5 minutes until deepened in color.', 3),
(9, 'Fold in shredded chicken, reduce heat to low, and cook for 10 minutes until chicken has absorbed the smoky sauce.', 4),
(9, 'Warm corn tortillas on a dry comal or skillet until soft and pliable.', 5),
(9, 'Fill tortillas with warm chicken tinga, sprinkle with diced onion, fresh cilantro, cotija cheese, and fresh lime juice.', 6),

-- Recipe 10: Quinoa Salad
(10, 'In a medium saucepan, combine rinsed quinoa and water. Bring to a boil, then cover, reduce heat to low, and simmer 15 minutes. Remove from heat and let steam 5 minutes, then fluff with a fork and cool.', 1),
(10, 'Whisk olive oil, lemon juice, dried oregano, salt, and black pepper to form the dressing.', 2),
(10, 'In a large mixing bowl, combine cooled quinoa, cherry tomatoes, cucumbers, Kalamata olives, red onion, and chopped fresh herbs.', 3),
(10, 'Pour dressing over salad and toss gently to coat.', 4),
(10, 'Top with toasted pine nuts before serving. Can be stored chilled for up to 4 days.', 5);

-- 6. Seed Reviews
INSERT INTO reviews (user_id, recipe_id, rating, comment) VALUES
(4, 1, 5, 'The crust was perfectly blistered and the sauce tasted like summer in Naples! Best homemade pizza dough technique I have tried.'),
(4, 5, 5, 'The crispy tofu texture was unbelievable! Followed the instructions step by step and the sweet tamarind glaze was restaurant quality.'),
(4, 3, 4, 'Rich, glossy, and luscious. Just make sure your pan has cooled slightly before tossing the eggs so they form a silky cream without scrambling.'),
(3, 2, 5, 'The combination of fresh mushrooms and reconstituted porcini gives this risotto so much depth. Mario nailed the mantecatura technique!'),
(4, 9, 5, 'Smoky, savory, and with just the right amount of chipotle kick. We made this for taco Tuesday and everyone requested it again!');

-- 7. Seed Collections for Explorer Sam
INSERT INTO collections (id, user_id, name, description) VALUES
(1, 4, 'Weekend Feast', 'Spectacular show-stopper recipes for hosting friends and family on Saturdays.'),
(2, 4, 'Quick 20-Min Dinners', 'Fast weeknight comfort meals when time is short.');

INSERT INTO collection_items (collection_id, recipe_id) VALUES
(1, 1),
(1, 5),
(1, 9),
(2, 3);

-- 8. Seed User Favorites (Sam's favorites)
INSERT INTO user_favorites (user_id, recipe_id) VALUES
(4, 1),
(4, 5);

-- 9. Seed Messages
INSERT INTO messages (sender_id, recipient_id, recipe_id, content, is_read) VALUES
(4, 2, 1, 'Hi Chef Mario! Loved your Margherita Pizza recipe! What brand of Tipo 00 flour do you recommend for best results in a home oven?', TRUE),
(2, 4, 1, 'Ciao Sam! Caputo Tipo 00 (red or blue bag) is outstanding. The key secret is preheating a heavy pizza steel or stone for at least 45 minutes on max heat!', FALSE),
(3, 2, NULL, 'Hey Mario! Would love to bounce some ideas for a summer fusion pasta workshop next month. Let me know when you have time for a call!', FALSE);

-- 10. Seed View History for Explorer Sam
INSERT INTO view_history (user_id, recipe_id, viewed_at) VALUES
(4, 1, NOW() - INTERVAL 2 HOUR),
(4, 5, NOW() - INTERVAL 5 HOUR),
(4, 3, NOW() - INTERVAL 12 HOUR),
(4, 9, NOW() - INTERVAL 24 HOUR);
