// Message generator based on personality and voice tone

export type PersonalityType = 'gentle' | 'funny' | 'pushy';
export type VoiceTone = 'ariana' | 'gordon' | 'snoop';

export interface MessageOptions {
  personality: PersonalityType;
  voiceTone: VoiceTone;
}

// Encouragement messages during work sessions
export const getEncouragementMessage = (options: MessageOptions): string => {
  const { personality, voiceTone } = options;

  // Gentle personality messages
  const gentleMessages = {
    ariana: [
      "You're doing amazing, babe! Keep shining! ✨💕",
      "Yuh, look at you go! So proud of you! 🌟",
      "You got this, sweetie! Believe in yourself! 💖",
      "You're literally crushing it! Love that for you! ✨",
      "Keep going, hun! You're incredible! 💫",
      "Aww, you're doing so well! Keep it up! 🥰",
      "Such a queen/king! You're amazing! 👑✨",
      "You're glowing! Keep that energy! 💕",
    ],
    gordon: [
      "Right, you're doing well. Keep that focus sharp!",
      "Good! Now maintain that standard. Don't slip!",
      "Excellent work. Keep it consistent!",
      "That's more like it! Stay on track!",
      "Well done! Now don't get complacent!",
      "Keep it up! You're showing real dedication!",
      "Good job! Stay focused and deliver!",
      "That's the effort I like to see! Continue!",
    ],
    snoop: [
      "Ayy, you vibin' real nice right now, keep it up! 😎",
      "That's what I'm talkin' bout, fo shizzle! 🎵",
      "You cruisin' smooth, homie! Stay in the zone! ✌️",
      "Real recognize real, and you doin' great! 💯",
      "Keep it flowin', you got the rhythm! 🎶",
      "You keepin' it 100, that's what's up! 🔥",
      "Smooth moves, my friend! Stay chill and focused! 😌",
      "You got that good energy, keep ridin' that wave! 🌊",
    ],
  };

  // Funny personality messages
  const funnyMessages = {
    ariana: [
      "Okurrr, at least you're trying! That's cute! 😏✨",
      "Wow, are you... actually working? Plot twist! 💅",
      "Not bad, not bad. I've seen worse, babe! 😌",
      "You're doing it! Should I call the press? 📰✨",
      "Look at you being all responsible! Character development! 🎭",
      "Yuh, I guess that counts as productivity! 😂💕",
      "Are you okay? You're actually focusing! 🤔✨",
      "Werk! Even if it's taking forever! 💃",
    ],
    gordon: [
      "Finally! Took you long enough to start!",
      "It's about bloody time you got moving!",
      "Oh, you decided to work? Brilliant! 🙄",
      "Look who's actually trying! Miracles do happen!",
      "Well, well, well... someone's awake!",
      "Is this what focus looks like for you? Interesting.",
      "Don't celebrate yet, you've barely started!",
      "Shocking! You're actually doing something!",
    ],
    snoop: [
      "Aight, you finally showed up to the party! 😂",
      "Better late than never, I suppose, dawg! 🤷",
      "Look who decided to get their hustle on! 💼",
      "Well damn, you really about to do this? Bet! 😏",
      "Yo, procrastination called, it misses you! 📞",
      "Finally! I was about to roll out! 🎲",
      "Took you a minute, but here we are! 😆",
      "You sure you ready? Aight, let's see what you got! 🎯",
    ],
  };

  // Pushy personality messages
  const pushyMessages = {
    ariana: [
      "Come ON, babe! You can do way better than this! 💪✨",
      "Stop being lazy! I know you're capable of more! 😤",
      "Yuh, pick up the pace! This is taking forever! ⏰",
      "Is this your best? Because it better not be! 💢",
      "Get it together! You're better than this mess! 🔥",
      "Move it! Time's wasting and so is your potential! ⚡",
      "Wake UP! Show me what you're really made of! 👊",
      "Less thinking, more DOING! Let's GO! 🚀",
    ],
    gordon: [
      "MOVE IT! You're slower than a snail in cement!",
      "What are you waiting for?! GET ON WITH IT!",
      "This is pathetic! I've seen turtles move faster!",
      "COME ON! You call this effort?! PUSH HARDER!",
      "Stop making excuses and START WORKING!",
      "Is this a joke?! Give me 110% NOW!",
      "You're wasting time! FOCUS and DELIVER!",
      "WAKE UP! This won't finish itself!",
    ],
    snoop: [
      "Yo, quit slackin'! Time ain't gonna wait for you! ⏰",
      "Come on now, you movin' like molasses! Speed it up! 🏃",
      "Dawg, I ain't got all day! Let's get it! 💨",
      "Stop playin' around! Get that work done! 📋",
      "Yo, you gonna finish or just stare at it? Move! 👀",
      "Get off your behind and make it happen! 🎯",
      "Aight, enough chillin'! Time to get serious! 💼",
      "You talkin' bout it or you bout it? Show me! 💪",
    ],
  };

  const messageSet =
    personality === 'gentle'
      ? gentleMessages
      : personality === 'funny'
      ? funnyMessages
      : pushyMessages;

  const messages = messageSet[voiceTone];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Chat response messages
export const getChatResponse = (options: MessageOptions): string => {
  const { personality, voiceTone } = options;

  const gentleResponses = {
    ariana: [
      "That's such a good point, babe! Keep going! 💕",
      "Yuh, I'm here with you! You're doing great! ✨",
      "Aww, that makes so much sense! You're so smart! 🥰",
      "You've got this, sweetie! I believe in you! 💖",
      "That's amazing thinking! Keep it up! 🌟",
      "I'm so proud of you for working through this! 💫",
    ],
    gordon: [
      "Good observation. Now apply it!",
      "That's solid thinking. Keep that focus!",
      "Well reasoned. What's your next step?",
      "I'm here. You're doing well. Continue!",
      "That makes sense. Now execute!",
      "Good question. Think it through carefully.",
    ],
    snoop: [
      "Aight, I feel you on that one! Keep vibin'! ✌️",
      "Real talk, that's a good point, homie! 💯",
      "I'm here chillin' with you, keep it movin'! 😎",
      "Fo shizzle, you're makin' sense! Stay focused! 🎵",
      "That's what's up! Keep that flow goin'! 🌊",
      "Yeah, I'm pickin' up what you're puttin' down! 🎶",
    ],
  };

  const funnyResponses = {
    ariana: [
      "Okay, werk I guess! At least you're thinking! 💅",
      "Hmm, interesting take... sure, why not! 😏✨",
      "Look at you being all intellectual! Love it! 📚",
      "That's... one way to think about it, babe! 😂",
      "Oh wow, brain cells activated! Yuh! 🧠✨",
      "I mean, I've heard worse ideas! Keep going! 💕",
    ],
    gordon: [
      "Finally, a decent thought! Took long enough!",
      "Oh, so you CAN think! Interesting!",
      "Well, that's not completely terrible!",
      "Look who's using their brain! About time!",
      "Is that your best? Fine, I'll take it!",
      "Not bad. Surprisingly not bad!",
    ],
    snoop: [
      "Aight, aight, I see you thinkin' now! 😂",
      "Oh snap, you got jokes AND thoughts! 🎭",
      "Look who woke up! Welcome to the party! 🎉",
      "Well damn, didn't know you had it in you! 💡",
      "Yo, that's actually not wack! Keep goin'! 🎯",
      "Okay, okay, I'm vibin' with that energy! 😆",
    ],
  };

  const pushyResponses = {
    ariana: [
      "Good! Now DO something about it! Move! 💪",
      "Yeah, yeah, less talking, more WORKING! ⚡",
      "Great! Now stop chatting and GET IT DONE! 🔥",
      "Okay, cool! NOW APPLY IT! Let's go! 🚀",
      "Nice thought! But thoughts don't finish tasks! 😤",
      "You gonna talk or you gonna work? CHOOSE! 💢",
    ],
    gordon: [
      "Right! Now STOP TALKING and START DOING!",
      "Good! Now shut up and GET TO WORK!",
      "Fine! But I want to see ACTION, not words!",
      "Brilliant! Now MOVE IT! Time's ticking!",
      "Excellent! Now EXECUTE! Go, go, GO!",
      "I don't need commentary! I need RESULTS!",
    ],
    snoop: [
      "Aight, cool! Now quit yappin' and work! 💼",
      "Yeah, yeah, I heard you! Now DO it! 🏃",
      "Less talk, more hustle! Let's GO! 💨",
      "That's nice, now put in the work, dawg! 💪",
      "Okay, I get it! Now show me somethin'! 🎯",
      "Cool story! Now get back to grindin'! ⚡",
    ],
  };

  const responseSet =
    personality === 'gentle'
      ? gentleResponses
      : personality === 'funny'
      ? funnyResponses
      : pushyResponses;

  const responses = responseSet[voiceTone];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Timer completion messages
export const getTimerCompleteMessage = (
  options: MessageOptions,
  isBreak: boolean
): string => {
  const { personality, voiceTone } = options;

  if (isBreak) {
    const breakMessages = {
      gentle: {
        ariana: "Break time, babe! You deserve it! Rest up! 🥰💕",
        gordon: "Break time. Rest well. You've earned it!",
        snoop: "Break time, homie! Kick back and relax! 😎✌️",
      },
      funny: {
        ariana: "Finally, a break! Don't get too comfortable! 😏✨",
        gordon: "Break. Don't get lazy now!",
        snoop: "Yo, break time! But don't fall asleep on me! 😂",
      },
      pushy: {
        ariana: "Break time! But make it quick! We got work to do! 💪",
        gordon: "5 MINUTES! Then back to work! GO!",
        snoop: "Aight, quick break! Don't get too comfy, dawg! ⏰",
      },
    };
    return breakMessages[personality][voiceTone];
  } else {
    const workMessages = {
      gentle: {
        ariana: "Time's up, sweetie! You did amazing! Great work! 🎉✨",
        gordon: "Time! Good work. Take your break!",
        snoop: "Ayy, time's up! You crushed it! Take five! 🎵",
      },
      funny: {
        ariana: "Wow, you actually finished! Miracles! 😂💕",
        gordon: "Time! Surprisingly, not terrible!",
        snoop: "Damn, you made it! Didn't think you had it in you! 😆",
      },
      pushy: {
        ariana: "Time! But you could've done more! Do better! 💢",
        gordon: "TIME! That's barely acceptable! IMPROVE!",
        snoop: "Time! But I expect MORE next round! Let's go! 🔥",
      },
    };
    return workMessages[personality][voiceTone];
  }
};

// Session end feedback
export const getSessionFeedback = (
  options: MessageOptions,
  completed: number,
  total: number,
  duration: number,
  sessionCompleted: boolean
): { title: string; message: string } => {
  const { personality, voiceTone } = options;

  const completionRate = total > 0 ? completed / total : 0;

  // Gentle feedback
  if (personality === 'gentle') {
    if (voiceTone === 'ariana') {
      if (completionRate === 1) {
        return {
          title: "You're literally PERFECT! 🌟",
          message: `Yuh! You finished ALL ${total} tasks, babe! I'm so proud! ✨💕`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Great job, sweetie! 💖',
          message: `You did ${completed} out of ${total} tasks! That's amazing! Keep shining! ✨`,
        };
      } else {
        return {
          title: 'You tried, and that matters! 💕',
          message: `${completed} tasks done! Every step counts, babe! I believe in you! 🥰`,
        };
      }
    } else if (voiceTone === 'gordon') {
      if (completionRate === 1) {
        return {
          title: 'Excellent Work!',
          message: `All ${total} tasks completed. That's the standard I expect. Well done!`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Good Progress!',
          message: `${completed} out of ${total} tasks. Solid effort. Keep it up!`,
        };
      } else {
        return {
          title: 'Decent Effort!',
          message: `${completed} tasks completed. There's room for improvement, but you showed up!`,
        };
      }
    } else {
      // snoop
      if (completionRate === 1) {
        return {
          title: 'Yo, you killed it! 🎉',
          message: `All ${total} tasks done, homie! That's what I'm talkin' bout! Keep it real! 💯`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Nice work, dawg! ✌️',
          message: `${completed} outta ${total}! You vibin' smooth! Keep that energy! 😎`,
        };
      } else {
        return {
          title: 'You showed up! 🎵',
          message: `${completed} tasks done! Keep grindin', homie! Rome wasn't built in a day! 💪`,
        };
      }
    }
  }

  // Funny feedback
  if (personality === 'funny') {
    if (voiceTone === 'ariana') {
      if (completionRate === 1) {
        return {
          title: 'OMG, did you actually...? 😱',
          message: `You finished EVERYTHING?! ${total} tasks?! Is this real life?! 💅✨`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Not too shabby! 😏',
          message: `${completed} out of ${total}! I've seen worse, babe! Keep it up, I guess! 💕`,
        };
      } else {
        return {
          title: 'Well, that was... something! 🙃',
          message: `${completed} tasks? That's cute! At least you tried! 😂`,
        };
      }
    } else if (voiceTone === 'gordon') {
      if (completionRate === 1) {
        return {
          title: 'Bloody Hell!',
          message: `You actually finished all ${total}! I'm genuinely shocked! Don't let it go to your head!`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Could Be Worse!',
          message: `${completed} out of ${total}. Not terrible. But not great either!`,
        };
      } else {
        return {
          title: 'Is That It?!',
          message: `Only ${completed} tasks?! I've seen snails move faster! But fine, whatever!`,
        };
      }
    } else {
      // snoop
      if (completionRate === 1) {
        return {
          title: 'Hold up, wait a minute! 😂',
          message: `You finished all ${total}?! Damn, didn't see that comin'! Respect! 🎯`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Aight, aight! 😆',
          message: `${completed} outta ${total}! Not bad for someone who looked sleepy earlier! 💤`,
        };
      } else {
        return {
          title: 'Bruh... really? 🤔',
          message: `${completed} tasks? That's all you got? Come on now, I know you better! 😏`,
        };
      }
    }
  }

  // Pushy feedback
  if (personality === 'pushy') {
    if (voiceTone === 'ariana') {
      if (completionRate === 1) {
        return {
          title: 'FINALLY! 💪',
          message: `ALL ${total} tasks DONE! That's what I expect! Now keep this energy! 🔥`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Not enough! 💢',
          message: `Only ${completed} out of ${total}?! You can do BETTER! Next time, finish ALL of them! ⚡`,
        };
      } else {
        return {
          title: 'Disappointing! 😤',
          message: `${completed} tasks?! That's pathetic! I KNOW you're capable of more! Step it UP! 💥`,
        };
      }
    } else if (voiceTone === 'gordon') {
      if (completionRate === 1) {
        return {
          title: "THAT'S IT!",
          message: `ALL ${total} DONE! That's the standard! Maintain it or you're OUT!`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'NOT GOOD ENOUGH!',
          message: `${completed} out of ${total}?! Why not ALL?! I want 100% next time! MOVE IT!`,
        };
      } else {
        return {
          title: 'PATHETIC!',
          message: `${completed} tasks?! This is UNACCEPTABLE! You're better than this! GET IT TOGETHER!`,
        };
      }
    } else {
      // snoop
      if (completionRate === 1) {
        return {
          title: "Now THAT'S what I'm talkin' bout! 🔥",
          message: `ALL ${total} done! Keep that hustle goin', dawg! Don't slack now! 💯`,
        };
      } else if (completionRate > 0.5) {
        return {
          title: 'Come on now! 💪',
          message: `${completed} outta ${total}?! I know you got more in the tank! Push harder, homie! ⚡`,
        };
      } else {
        return {
          title: "Yo, that ain't it! 😤",
          message: `${completed} tasks?! Come ON! You can do way better! Stop playin' around! 🎯`,
        };
      }
    }
  }

  // Default fallback
  return {
    title: 'Session Complete',
    message: `You completed ${completed} out of ${total} tasks in ${duration} minutes!`,
  };
};
