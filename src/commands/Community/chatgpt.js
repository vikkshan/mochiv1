const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Importing OpenAI API Key from .env file
const apiKey = process.env.OPENAI;

// Configuring the OpenAI API with the API Key
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

// Defining the retry limit and delay for the OpenAI request
const RETRY_LIMIT = 5;
const WAIT_TIME = 1000;

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
    // Deferring the reply to allow time to get the response from OpenAI
    await interaction.deferReply();

    // Getting the question to ask ChatGPT
    const question = interaction.options.getString('question');
    let retries = 0;

    // Retrying the request to OpenAI if it fails, up to the retry limit
    while (retries < RETRY_LIMIT) {
      try {
        // Sending the request to OpenAI to complete the text
        const res = await openai.createCompletion({
          model: 'text-davinci-003',
          max_tokens: 2048,
          temperature: 0.5,
          prompt: question
        });

        // Creating an Embed to display the response from OpenAI
        const embed = new EmbedBuilder()
          .setColor('Blue')
          .setDescription(`\`\`\`${res.data.choices[0].text}\`\`\``);

        // Editing the reply with the Embed containing the response from OpenAI
        await interaction.editReply({ embeds: [embed] });
        return;
      } catch (e) {
        if (e.response && e.response.status === 429) {
          // Retrying the request if rate limit is reached
          ++retries;
          await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
        } else {
          // Sending an error reply if the request failed with a different status code
          return await interaction.editReply({
            content: `Request failed with status code **${e.response.status}**`,
            ephemeral: true
          });
        }
      }
    }
    // Sending an error reply if the request failed after the retry limit
    return await interaction.editReply({
      content: `Maximum retries exceeded: The request failed after ${RETRY_LIMIT} attempts, Please try again later or visit https://chat.openai.com/chat/`,
      ephemeral: true
    });
  }
};
