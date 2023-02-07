const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, SelectMenuBuilder, SlashCommandBuilder, ChannelType } = require('discord.js');
const ticketSchema = require('../../schema/ticketSchema.js');

module.exports = {
  data: new SlashCommandBuilder()
  .setName("ticket-setup")
  .setDescription("Setup a ticket system")
  .addChannelOption(option => option.setName("channel").setDescription("Channel to send ticket system").addChannelTypes(ChannelType.GuildText).setRequired(true))
  .addChannelOption(option => option.setName("category").setDescription("Category to create tickets in").addChannelTypes(ChannelType.GuildCategory).setRequired(true)),
  async execute(interaction) {

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return interaction.reply({content: "You do not have permission to use this command", ephemeral: true})

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
      .setTitle('Ticket System')
      .setDescription("If you have problem select an option to open a ticket")
      .setColor("Purple")
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