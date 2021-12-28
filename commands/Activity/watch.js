const { SlashCommandBuilder } = require('@discordjs/builders');

this.name = 'watch'
this.description = 'Creates a YoutubeTogether room'

module.exports = {
    name: this.name,
    description: this.description,
    type: 'Activity',
    cooldown: 10,
    guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description),
	async execute(interaction) {
		if(interaction.member.voice == null){
            return interaction.reply('You have to be in a voice channel to do this');
        }

        interaction.member.voice.channel.createInvite(
            {
                maxAge: 7200,
                targetType: 2,
                targetApplication: "755600276941176913",
            }
        )
        .then(invite => interaction.reply(`https://discord.com/invite/${invite.code}`))
        .catch(console.error);
	},
};