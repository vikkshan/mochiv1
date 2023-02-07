const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, SlashCommandBuilder } = require('discord.js');
const ticketSchema = require('../../schema/ticketSchema.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-setup")
        .setDescription("Setup a ticket system")
        .addChannelOption(option => option.setName("channel").setDescription("Channel to send ticket system").setRequired(true))
        .addChannelOption(option => option.setName("category").setDescription("Category to create tickets in").setRequired(true)),
        async execute(interaction) {

        

        const channel = interaction.options.getChannel("channel")
        const category = interaction.options.getChannel("category")

        ticketSchema.findOne({guildId: interaction.guild.id}, async (err, data) => {
            if (!data) {
                ticketSchema.create({
                    Guild: interaction.guild.id,
                    Channel: category.id,
                    Ticket: `first`
                })
                } else {
                    await interaction.reply({content: "Ticket system already setup. You can use /ticket-disable to remove and start over", ephemeral: true})
                    return;
                }

                const embed = new EmbedBuilder()
                .setTitle("Ticket System")
                .setDescription("React to open a ticket")
                .setColor("RANDOM")
                .setFooter({ text: `${interaction.guild.name} Ticket System`})

                const menu = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                    .setCustomId("select")
                    .setPlaceholder("Select a ticket topic...")
                    .setMaxValues(1)
                    .addOptions(
                        {
                            label: 'General support',
                            value: 'Subject: General support',
                          },
                          {
                            label: 'Moderation support',
                            value: 'Subject: Moderation support',
                          },
                          {
                            label: 'Server support',
                            value: 'Subject: Server support',
                          },
                          {
                            label: 'Other',
                            value: 'Subject: Other',
                          },
                    )
                )

                await channel.send({embeds: [embed], components: [menu]});
                await interaction.reply({content: `Ticket system setup in ${channel}`, ephemeral: true})
            })


        }    
}
