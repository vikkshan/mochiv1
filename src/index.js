const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection } = require(`discord.js`);
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
