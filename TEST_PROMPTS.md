# Test Prompts for Gemini Classification

This file contains a set of test prompts and expected outputs for the YouTube Kid-Filter's Gemini classification model.

---

### Test Case 1: Clearly Educational (Science)

**Input:**
```json
{
  "title": "What Is A Black Hole? | Black Holes Explained | The Dr Binocs Show",
  "description": "Learn about Black Holes with Dr. Binocs. Did you know that a black hole is a place in space where gravity pulls so much that even light can not get out? Join Dr. Binocs on this amazing space adventure and find out more about Black Holes!",
  "channelName": "Peekaboo Kidz",
  "transcriptSnippet": "A black hole is a region of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it. The theory of general relativity predicts that a sufficiently compact mass can deform spacetime to form a black hole."
}
```

**Expected Output:**
```json
{
  "label": "educational",
  "confidence": 0.95,
  "reason": "Explains a scientific concept (black holes) for a young audience."
}
```

---

### Test Case 2: Clearly Educational (History)

**Input:**
```json
{
  "title": "The French Revolution: Crash Course World History #29",
  "description": "In which John Green investigates the French Revolution, and gets into how and why it differed from the American Revolution. Was it the success or failure of the Enlightenment? Or the methods of the ancien regime? Or the abstract nature of French Revolutionary ideals? Or the pants?",
  "channelName": "CrashCourse",
  "transcriptSnippet": "The French Revolution was a period of radical political and societal change in France that began with the Estates General of 1789 and ended with the formation of the French Consulate in November 1799."
}
```

**Expected Output:**
```json
{
  "label": "educational",
  "confidence": 0.98,
  "reason": "Educational content about a historical event from a reputable channel."
}
```

---

### Test Case 3: Clearly Non-Educational (Gaming)

**Input:**
```json
{
  "title": "I Beat a Minecraft Escape Room in 100 Seconds!",
  "description": "this was the fastest escape room i have ever done lol",
  "channelName": "Dream",
  "transcriptSnippet": "Oh my god, we're going so fast! Jump, jump! I got the key! Let's go! We're out, we're out! Let's go!"
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.9,
  "reason": "Entertainment-focused gameplay video with no instructional value."
}
```

---

### Test Case 4: Clearly Non-Educational (Prank)

**Input:**
```json
{
  "title": "ULTIMATE PRANK WAR!! (GONE WRONG)",
  "description": "My friends and I have a prank war. It gets crazy!",
  "channelName": "Jake Paul",
  "transcriptSnippet": "It's just a prank, bro! He's so mad! Look at his face! This is epic!"
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.99,
  "reason": "Prank video, which is a form of entertainment with no educational value."
}
```

---

### Test Case 5: Ambiguous (Edutainment)

**Input:**
```json
{
  "title": "The Weird History of the Potato",
  "description": "How the humble potato changed the world. From the Andes to Ireland and beyond.",
  "channelName": "Food Theory",
  "transcriptSnippet": "So the potato, this lumpy, unassuming tuber, was actually a major player in global politics and economics. It's more than just a side dish; it's a history maker."
}
```

**Expected Output:**
```json
{
  "label": "educational",
  "confidence": 0.75,
  "reason": "Presents historical and cultural information in an entertaining format."
}
```

---

### Test Case 6: Misleading Title (Clickbait but educational content)

**Input:**
```json
{
  "title": "YOU WON'T BELIEVE what's inside this COMPUTER!",
  "description": "In this video, we're taking a deep dive into the components of a modern computer. We'll look at the CPU, GPU, RAM, and motherboard, and explain what each part does.",
  "channelName": "TechQuickie",
  "transcriptSnippet": "The central processing unit, or CPU, is the brain of the computer. It performs most of the processing inside the computer. Let's take a closer look at how it works."
}
```

**Expected Output:**
```json
{
  "label": "educational",
  "confidence": 0.8,
  "reason": "Despite the clickbait title, the content is a tutorial about computer hardware."
}
```

---

### Test Case 7: Misleading Title (Educational but is actually a toy review)

**Input:**
```json
{
  "title": "Learn Colors with Fun Shapes!",
  "description": "Let's learn colors with these awesome new toys!",
  "channelName": "Toy Review Fun",
  "transcriptSnippet": "This one is red! And this one is blue! Wow! So many colors! Let's open the next surprise egg!"
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.85,
  "reason": "Primarily a toy review/unboxing video, not a structured lesson on colors."
}
```

---

### Test Case 8: Arts and Crafts Tutorial

**Input:**
```json
{
  "title": "How to Make a Paper Airplane that Flies Far",
  "description": "Follow these simple steps to fold a paper airplane that can fly over 100 feet!",
  "channelName": "Origami Fun",
  "transcriptSnippet": "First, fold the paper in half lengthwise. Then, unfold it. Now, fold the top two corners to the center crease. Make sure the folds are sharp."
}
```

**Expected Output:**
```json
{
  "label": "educational",
  "confidence": 0.9,
  "reason": "A clear, step-by-step tutorial on how to create something."
}
```

---

### Test Case 9: Music Video

**Input:**
```json
{
  "title": "Baby Shark Dance | #babyshark Most Viewed Video | Animal Songs | PINKFONG Songs for Children",
  "description": "Sing along to the Baby Shark song with us!",
  "channelName": "PINKFONG",
  "transcriptSnippet": "Baby shark, doo doo doo doo doo doo. Baby shark, doo doo doo doo doo doo. Baby shark!"
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.9,
  "reason": "A children's song for entertainment, not for educational purposes."
}
```

---

### Test Case 10: Nursery Rhyme (Potentially Educational)

**Input:**
```json
{
  "title": "The ABC Song | CoComelon Nursery Rhymes & Kids Songs",
  "description": "Sing the alphabet song with JJ and his friends!",
  "channelName": "CoComelon",
  "transcriptSnippet": "A, B, C, D, E, F, G... Now I know my ABCs, next time won't you sing with me?"
}
```

**Expected Output:**
```json
{
  "label": "educational",
  "confidence": 0.7,
  "reason": "Teaches the alphabet, a foundational skill, through a nursery rhyme."
}
```

---

### Test Case 11: No Description or Transcript

**Input:**
```json
{
  "title": "Amazing Science Experiments",
  "description": "",
  "channelName": "Science Max",
  "transcriptSnippet": ""
}
```

**Expected Output:**
```json
{
  "label": "uncertain",
  "confidence": 0.5,
  "reason": "The title suggests educational content, but there is not enough information to be certain."
}
```

---

### Test Case 12: Vague Title and Description

**Input:**
```json
{
  "title": "A Day in the Life",
  "description": "Come along with me on a typical day.",
  "channelName": "Everyday Vlogger",
  "transcriptSnippet": "So the first thing I do is wake up and get some coffee. It's a beautiful day outside. I'm thinking of going to the park later."
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.8,
  "reason": "A personal vlog, which is a form of entertainment, not education."
}
```

---

### Test Case 13: Product Review

**Input:**
```json
{
  "title": "The New iPad Pro is AMAZING!",
  "description": "I got my hands on the new iPad Pro and I'm going to tell you all about it.",
  "channelName": "Tech Reviewer",
  "transcriptSnippet": "The screen is absolutely gorgeous. The new M4 chip is incredibly fast. But is it worth the price? Let's find out."
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.7,
  "reason": "A product review, which is primarily for consumers, not for educational purposes in a children's context."
}
```

---

### Test Case 14: ASMR Video

**Input:**
```json
{
  "title": "ASMR 100+ Triggers in 10 Minutes (No Talking)",
  "description": "Relax and enjoy these ASMR triggers.",
  "channelName": "ASMR Darling",
  "transcriptSnippet": ""
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.95,
  "reason": "ASMR videos are for relaxation and sensory experience, not education."
}
```

---

### Test Case 15: DIY/Life Hacks

**Input:**
```json
{
  "title": "10 Amazing Life Hacks You Need to Know!",
  "description": "These life hacks will change your life! From cleaning tips to organization tricks.",
  "channelName": "5-Minute Crafts",
  "transcriptSnippet": "Use a binder clip to organize your cables. You can also use a hot glue gun to create non-slip hangers. It's so easy!"
}
```

**Expected Output:**
```json
{
  "label": "non-educational",
  "confidence": 0.6,
  "reason": "While some tips might be useful, these videos are typically fast-paced entertainment and not structured tutorials."
}
```
