

const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const sharp = require("sharp");
const { token, welcomeChannelId, welcomeBackgroundImageURL } = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) return;

  try {
    // تحميل خلفية الترحيب من الرابط في config.json
    const backgroundBuffer = await axios.get(welcomeBackgroundImageURL, { responseType: "arraybuffer" });
    const backgroundImage = sharp(backgroundBuffer.data).resize(1024, 1024); // التأكد من أن الخلفية مربعة بحجم 1024x1024

    // تحميل صورة العضو
    const avatarURL = member.user.displayAvatarURL({ format: "png", size: 1024 });
    const { data } = await axios.get(avatarURL, { responseType: "arraybuffer" });

    let avatarImage = sharp(data)
      .resize(256, 256) // تغيير حجم صورة العضو لتصبح 256x256
      .toBuffer()
      .then((buffer) => {
        // رسم صورة العضو في شكل دائرة
        return sharp(buffer)
          .resize(256, 256)
          .extract({ left: 0, top: 0, width: 256, height: 256 }) // تأكيد أن الصورة مربعة
          .toBuffer();
      });

    // دمج صورة العضو مع الخلفية
    const welcomeImage = await backgroundImage
      .composite([
        {
          input: await avatarImage, 
          left: 384, // تحديد مكان الصورة داخل الخلفية (الموقع داخل الصورة المربعة)
          top: 384, // تحديد المكان بشكل مناسب بحيث يكون في المنتصف تقريبًا
          raw: { width: 256, height: 256, channels: 3 },
        }
      ]) // دمج الصورة داخل الخلفية
      .toBuffer();

    // إرسال الصورة المدمجة كملف مرفق
    const attachment = {
      files: [{ attachment: welcomeImage, name: "welcome-image.png" }],
    };

    channel.send({ content: `🎉 مرحبًا بك في السيرفر, ${member.user.username}!`, ...attachment });

  } catch (error) {
    console.error("حدث خطأ:", error);
  }
});

client.login("MTM1NjI3MDk2ODA5NTM3OTYyNw.GHAlb_.tPf4vC8o-1RPsjQNNf1pO1ayfRhvE5-AOCIp_I");