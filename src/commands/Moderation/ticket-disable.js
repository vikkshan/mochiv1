const { PermissionsBitField, SlashCommandBuilder } = require("discord.js")
const ticketSchema = require("../../schema/ticketSchema.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-disable")
        .setDescription("Disable ticket system"),
        async execute(interaction) {

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administarator)) return interaction.reply({content: "You do not have permission to use this command", ephemeral: true})

          ticketSchema.deleteMany({Guild: interaction.guild.id}, async (err, data) => {
                if (!data) {
                    await interaction.reply({content: "Ticket system is not setup", ephemeral: true})
                } else (
                    await interaction.reply({content: "Ticket system has been disabled", ephemeral: true})
                )
          })
        }    
}