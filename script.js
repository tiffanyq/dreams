window.hallucinationLevel = 3;
window.currentDreamIndex = 0;
const dreams = [
  {
    img: "img/office.jpg",
    content: {
    1: "You are at work. Every bathroom stall on your floor is full. You check the floor above. The bathroom is closed. You are now running late to your presentation.",
    2: "Your presentation goes poorly. Your partner texts you. We should break up. Your colleague pings you. Is now still a good time? You smell something burning.",
    3: "It's 2:03pm, on the cusp of 2:04pm. You finally locate the meeting room. It's a folding table in a parking space. Everyone is already gone. Also, where is your wallet?",
    4: "A horse approaches you and asks if you need help taking notes during your presentation. You are relieved. You always forget about notes. Thank you to this horse.",
    5: "You commute to work by swimming across the Pacific. You swam too slowly. The office is closed for the day. You missed your big presentation. Your clothes are wet."
    }
  },
  {
    img: "img/friends.jpg",
    content: {
    1: "You think about who to invite to your birthday dinner and get sad because no one is in town.",
    2: "Your friend tells you about last night's party. What party? Someone from middle school is in your original friend's spot. They continue talking about the party.",
    3: "You find your friend stranded on the highway. A truck passes by. You hoist your friend onto your back and jump into the truck bed. Your friend throws you out of the truck, laughing as she disappears into the horizon.",
    4: "You've never seen this theme park right next to your apartment. You check it out and it's run by ALL of your friends. Why did they never tell you about their joint theme park venture?",
    5: "You and your friends spawn in a meadow and you all float into the sky. Suddenly, only you start falling. You're now in the local mall that just closed down. Your friends round the corner, laughing.",
    }
  },
  {
    img: "img/window.jpg",
    content: {
      1: "You look out a window and think: I have no idea what I am doing.",
      2: "Your friend sees a chocolate shop and starts sharing chocolate facts. This is out of character: hating chocolate is part of his personality.",
      3: "You are sitting beneath a famous tree. You were told to wait here for the love of your life to appear.",
      4: "You are on a quest to boil some broccoli. You sleep on the pot of broccoli, hoping your body heat will be enough to boil it. You forget who this broccoli is for.",
      5: "You're browsing Costco when there's an announcement: everything is now free. You grab the most space-efficient valuable you can think of: jewelry. You start flying, soaring above the crowd below. You don't even wear jewelry."
    }
  },
  {
    img: "img/sky.jpg",
    content: {
      1: "You put your head on your crush's shoulder.",
      2: "You check your inbox. It's a yes!!!!! But you're not supposed to hear back for another week...?",
      3: "You're stuck in a parking lot after a first date. Your date appears in the passenger seat and says: don't worry, let's go. You drive away, making several lane changes despite the roads being completely empty.",
      4: "You walk along the seawall straight into airport security. You show your empty water bottle to the staff. You're the best traveller they've ever seen.",
      5: "You are competing at the Summer Olympics. You board the plane and do front aerials down the aisle. Now you're in the stadium. Your family parachutes down from the stands to drop off your shoes."
    }
  },
  {
    img: "img/trail.jpg",
    content: {
      1: "Your friends call you. They just got engaged!!",
      2: "You keep chewing, but no matter how much you chew, you can't seem to finish your food.",
      3: "You see a news item that carrots have been banned in the Americas.",
      4: "You are running. It's been miles now and you still feel great. This must be that fabled Zone 2. Eventually, you enter a new biome. You spot a cactus.",
      5: "You star in a TV show about being the newest arrival at ballet school. This ballet school is inside a restaurant. Pokemon soar overhead, thanks to a startup sponsoring the show."
    }
  }
];

function setDreamText() {
  const dreamText = document.getElementById("dream-text");
  dreamText.innerText = dreams[window.currentDreamIndex].content[window.hallucinationLevel];
}

function setDreamBackground() {
  newPath = dreams[window.currentDreamIndex].img;
  window.setDreamImage(newPath);
}

function toggleSound() {
  const s = document.getElementById("sound");
  if (s.innerText === "Turn sound on") {
    s.innerText = "Turn sound off";
    music.play();
  } else {
    s.innerText = "Turn sound on";
    music.pause();
  }
}

window.addEventListener("load", function(event) {
  document.querySelectorAll('input[name="hallucination"]').forEach(radio => {
    radio.addEventListener('change', () => {
      window.hallucinationLevel = radio.value;
      setDreamText();
      setDreamBackground();
    });
  });
  
  document.getElementById('refresh-dream').addEventListener('click', () => {
    let nextIndex = window.currentDreamIndex;
    while (nextIndex === window.currentDreamIndex) {
      nextIndex = Math.floor(Math.random() * dreams.length);
    }
    window.currentDreamIndex = nextIndex;
    setDreamText();
    setDreamBackground();
  });

  const s = document.getElementById("sound");
  s.addEventListener("click", toggleSound, false);
  music = new Audio('sound.mp3');
  music.loop = true;
});

