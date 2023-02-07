const { Client, GatewayIntentBits, EmbedBuilder, Collection, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType, ButtonStyle } = require(`discord.js`);
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Start the Express.js server on a specific port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Initialize the Discord Client with specific intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] }); 

// Create a collection to store the commands
client.commands = new Collection();

// Load environment variables from .env file
require('dotenv').config();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Read all .js files in the "functions" directory and store in the "functions" variable
const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));

// Read all .js files in the "events" directory and store in the "eventFiles" variable
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));

// Read all the directories in the "commands" directory and store in the "commandFolders" variable
const commandFolders = fs.readdirSync("./src/commands");

// Anonymous function to initialize the Discord client
(async () => {
    // Loop through each function file and require it
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    // Handle the events from the event files
    client.handleEvents(eventFiles, "./src/events");
    // Handle the commands from the command folders
    client.handleCommands(commandFolders, "./src/commands");
    // Login to the Discord API using the token from the environment variable
    await client.login(process.env.token);
})();

const ticketSchema = require("./schema/ticketSchema.js");
const ready = require('./events/ready.js');
client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isButton()) return;
    if (interaction.isChatInputCommand()) return;

    const modal = new ModalBuilder()
    .setTitle("Provide us with some information")
    .setDescription("Please provide us with some information so we can help you")
    .setCustomId("ticket-modal")

    const username = new TextInputBuilder()
    .setCustomId("username")
    .setPlaceholder("Please input your username")
    .setMinLength(3)
    .setMaxLength(16)
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setLabel("Username")

    const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setPlaceholder("Please input the reason for your ticket")
    .setMinLength(3)
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setLabel("Reason")

    const firstActionRow = new ActionRowBuilder().addComponents(username)
    const secondActionRow = new ActionRowBuilder().addComponents(reason)

    modal.addComponents(firstActionRow, secondActionRow);

    let choices;
    if (interaction.isSelectMenu()) {

        choices = interaction.values;
            
        const result = choices.join('');

        ticketSchema.findOne({ Guild: interaction.guild.id}, async () => {

            const filter = {Guild: interaction.guild.id};
            const update = {Ticket: result};

            ticketSchema.updateOne(filter, update, {
                new: true
            }).then(value => {
                console.log(value)
            })

        })

    }

    if (!interaction.isModalSubmit()) {
        interaction.showModal(modal)
    }

})

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isModalSubmit()) {

        if (interaction.customId == 'ticket-modal') {

            ticketSchema.findOne({Guild: interaction.guild.id}, async (err, data) => {

                const usernameInput = interaction.getTextInputValue('username');
                const reasonInput = interaction.getTextInputValue('reason');

                const postChannel = await interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`);
                if (postChannel) return; await interaction.reply({ content: `You already have a ticket open - ${postChannel}`, ephemeral: true });

                const category = data.Channel;

                const embed = new EmbedBuilder()
                .setTitle(`Ticket for ${interaction.user.username}`)
                .setDescription(`Welcome ${usernameInput} Please wait for staff to review the information you have provided`)
                .setColor("RANDOM")
                .addFields({name: "Reason", value: reasonInput, inline: false})
                .addFields({name: `Type`, value: `${data.Ticket}`, inline: false})
                .addFooter({text: `Ticket ID: ${interaction.user.id}`})

                const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setLabel("Close Ticket")
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId("close-ticket")
                )

                let channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.id}`,
                    type: ChannelType.GuildText,
                    parent: `${category}`
                })

                let msg = await channel.send({ embeds: [embed], components: [button] });
                await interaction.reply({ content: `Your ticket has been created - ${channel}`, ephemeral: true });

                const collector = msg.createMessageComponentCollector()

                collector.on('collect', async () => {
                    ;(await channel).delete();


                    const dmEmbed = new EmbedBuilder()
                    .setTitle(`Your ticket has been closed`)
                    .setDescription(`Thank you for using our support system, if you have any further questions please open a new ticket`)
                    .setColor("Purple")
                    .addFooter({text: `Ticket ID ${interaction.user.id}`})
                    .setTimestamp()

                    await interaction.member.send({ embeds: [dmEmbed] }).catch (() => {
                        return;
                    })

                })

            })
        }
    }
})

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const activities = [
        `in ${client.guilds.cache.size} servers!`,
        `with ${client.users.cache.size} users!`,
        `in ${client.channels.cache.size} channels!`
    ];
    const statuses = ["dnd", "idle"];

    let statusIndex = 0;

    setInterval(() => {
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const status = statuses[statusIndex];
        client.user.setPresence({
            status: status,
            activities: [{ name: `${activity}`}]
        });

        statusIndex = (statusIndex + 1) % statuses.length;
    }, 10000);
});