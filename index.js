require("dotenv").config();
const { Client, GatewayIntentBits, Partials, ContextMenuCommandBuilder, ApplicationCommandType, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require("discord.js");
const translateText = require("./utils/translate");
const fs = require("fs");
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const autoTranslateFile = "./data/autoTranslateChannels.json";
let autoTranslateChannels = fs.existsSync(autoTranslateFile) ? JSON.parse(fs.readFileSync(autoTranslateFile, "utf8")) : {};

function saveChannels() {
  fs.writeFileSync(autoTranslateFile, JSON.stringify(autoTranslateChannels, null, 2));
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new ContextMenuCommandBuilder().setName("Translate").setType(ApplicationCommandType.Message),
    new ContextMenuCommandBuilder().setName("Translate to Russian").setType(ApplicationCommandType.Message),
    new ContextMenuCommandBuilder().setName("Translate to Polish").setType(ApplicationCommandType.Message),
    new ContextMenuCommandBuilder().setName("Translate to English").setType(ApplicationCommandType.Message)
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

  client.application.commands.create({
    name: "manage_translate_channels",
    description: "Manage channels with auto-translate",
  });
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isMessageContextMenuCommand()) {
    const lang = interaction.commandName.split("to ")[1] || "English";
    const translation = await translateText(interaction.targetMessage.content, lang);
    await interaction.reply({ content: translation, ephemeral: true });
  }

  if (interaction.isChatInputCommand() && interaction.commandName === "manage_translate_channels") {
    await interaction.reply({
      content: "**Manage Auto-Translate Channels**",
      components: [
        {
          type: 1,
          components: [
            new ButtonBuilder().setCustomId("add-channel").setLabel("Add Auto-Translate Channel").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("remove-channel").setLabel("Remove Auto-Translate Channel").setStyle(ButtonStyle.Danger)
          ]
        }
      ],
      ephemeral: true
    });
  }

  if (interaction.isButton()) {
    if (interaction.customId === "add-channel") {
      const modal = new ModalBuilder().setCustomId("add-modal").setTitle("Add Auto-Translate Channel").setComponents([
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("channel").setLabel("Channel ID").setStyle(TextInputStyle.Short)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("lang").setLabel("Language Code (e.g., English, Russian, Polish)").setStyle(TextInputStyle.Short))
      ]);
      await interaction.showModal(modal);
    }

    if (interaction.customId === "remove-channel") {
      const modal = new ModalBuilder().setCustomId("remove-modal").setTitle("Remove Auto-Translate Channel").setComponents([
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("channel").setLabel("Channel ID").setStyle(TextInputStyle.Short))
      ]);
      await interaction.showModal(modal);
    }
  }

  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === "add-modal") {
      const channel = interaction.fields.getTextInputValue("channel");
      const lang = interaction.fields.getTextInputValue("lang");
      autoTranslateChannels[channel] = lang;
      saveChannels();
      await interaction.reply({ content: `Added channel ${channel} with language ${lang}.`, ephemeral: true });
    }

    if (interaction.customId === "remove-modal") {
      const channel = interaction.fields.getTextInputValue("channel");
      delete autoTranslateChannels[channel];
      saveChannels();
      await interaction.reply({ content: `Removed channel ${channel}.`, ephemeral: true });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (autoTranslateChannels[message.channel.id]) {
    const lang = autoTranslateChannels[message.channel.id];
    const translated = await translateText(message.content, lang);
    await message.reply(`🌐 ${translated}`);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  const emojiToLang = { "🇷🇺": "Russian", "🇬🇧": "English", "🇵🇱": "Polish" };
  const lang = emojiToLang[reaction.emoji.name];
  if (!lang || !reaction.message) return;

  const translated = await translateText(reaction.message.content, lang);
  await reaction.message.reply(`🌐 ${translated}`);
});

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('Discord Translator Bot is running!');
});

app.listen(port, () => {
    console.log(`HTTP server listening on port ${port}`);
});

client.login(process.env.DISCORD_TOKEN);
