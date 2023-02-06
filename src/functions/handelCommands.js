// Importing required modules
const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

// Declaring a constant for the Guild ID
const guildId = '1015941854124060683'; 

// Exporting a function that receives a "client" object as its argument
module.exports = (client) => {
  // Adding a new property to the client object named "handleCommands"
  client.handleCommands = async (commandFolders, path) => {
    // Creating an array property on the client object to store the loaded commands
    client.commandArray = [];
    // Loop through each folder in the commandFolders array
    for (folder of commandFolders) {
      // Read all the files in the current folder and filter out any that are not JavaScript files
      const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
      // Loop through each file in the commandFiles array
      for (const file of commandFiles) {
        // Require the command file and assign it to the "command" constant
        const command = require(`../commands/${folder}/${file}`);
        // Add the command to the "client.commands" Map with its name as the key
        client.commands.set(command.data.name, command);
        // Push the command data to the "client.commandArray" array
        client.commandArray.push(command.data.toJSON());
      }
    }

    // Create a new instance of the REST class and set its token
    const rest = new REST({
      version: '9'
    }).setToken(process.env.token);

    // Wrap the code in an anonymous asynchronous function
    (async () => {
      try {
        // Log that the refresh process has started
        console.log('Started refreshing application (/) commands.');

        // Make a PUT request to the Discord API to refresh the application commands
        await rest.put(
          Routes.applicationCommands(process.env.clientId), {
            body: client.commandArray
          },
        );

        // Log that the refresh process was successful
        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        // Log the error if it occurs
        console.error(error);
      }
    })();
  };
};
