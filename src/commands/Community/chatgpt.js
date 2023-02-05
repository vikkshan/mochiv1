const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const apiKey = process.env.OPENAI;
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

const RETRY_LIMIT = 5;
const RETRY_DELAY = 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatgpt')
    .setDescription('Ask ChatGPT a question')
    .addStringOption(
      option =>
        option
          .setName('question')
          .setDescription('The question to ask ChatGPT')
          .setRequired(true)
    )
    .setDMPermission(false),
  async execute(interaction) {
    await interaction.deferReply();

    const question = interaction.options.getString('question');
    let retries = 0;

    while (retries < RETRY_LIMIT) {
      try {
        const res = await openai.createCompletion({
          model: 'text-davinci-003',
          max_tokens: 2048,
          temperature: 0.5,
          prompt: question
        });

        const embed = new EmbedBuilder()
          .setColor('Blue')
          .setDescription(`\`\`\`${res.data.choices[0].text}\`\`\``);

        await interaction.editReply({ embeds: [embed] });
        return;
      } catch (e) {
        if (e.response && e.response.status === 429) {
          ++retries;
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          return await interaction.editReply({
            content: `Request failed with status code **${e.response.status}**`,
            ephemeral: true
          });
        }
      }
    }
    return await interaction.editReply({
      content: `Maximum retries exceeded: The request failed after ${RETRY_LIMIT} attempts, Please try again later or visit https://chat.openai.com/chat/`,
      ephemeral: true
    });
  }
};
