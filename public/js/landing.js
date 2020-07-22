function randomNewsSourceSuffix() {
  return Util.chooseRandom([
    "Tribune",
    "Chronicle",
    "Herald",
    "News",
    "Daily",
    "Post",
    "Chronicle",
    "Register",
    "Inquirer",
    "Republic",
    "Review",
    "Journal",
    "Globe",
    "Gazette",
    "Herald",
    "Bulletin",
    "Free Press",
    "Spectator",
    "Citizen",
    "Examiner",
    "Reformer",
    "Observer",
    "Standard",
    "Express",
    "Mirror",
    "Independent"
  ])
}

function chooseSillyName() {
  document.getElementById('apparatusName').innerHTML =
   "The X-Fake " + randomNewsSourceSuffix()
}
