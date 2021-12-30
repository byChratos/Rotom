const { SlashCommandBuilder } = require('@discordjs/builders');
const Canvas =  require('canvas');
const { MessageAttachment } = require('discord.js');

//Text for image manipulation
const applyText = (canvas, text) => {
	const context = canvas.getContext('2d');
	let fontSize = 70;

	do {
		context.font = `${fontSize -= 10}px sans-serif`;
	} while (context.measureText(text).width > canvas.width - 300);

	return context.font;
};

this.name = 'profile';
this.description = 'Sieh dir dein Bot eigenes Profil an.'

module.exports = {
	name: this.name,
	description: this.description,
	type: 'Cosmetic',
	cooldown: 3,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addStringOption(option =>
			option.setName('design')
			.setDescription('Design for testing')
			.setRequired(true)),
	async execute(interaction) {
        const canvas = Canvas.createCanvas(1200, 600);
        const context = canvas.getContext('2d');

		const design = interaction.options.getString('design');

		let orden = 0;
		let primaryColor;
		let secondaryColor;

		if(design == 'pokeball'){
			primaryColor = '#C60008';
			secondaryColor = '#f5f3f4';
		}else if(design == 'superball'){
			primaryColor = '#00A1EF';
			secondaryColor = '#bb323c';
		}else if(design == 'hyperball'){
			primaryColor = '#312d2c';
			secondaryColor = '#f8dd6c';
		}else if(design == 'meisterball'){
			primaryColor = '#6a4fa0';
			secondaryColor = '#c83a82';
		}

		//Rectangle Background
		context.beginPath();
		context.fillStyle = primaryColor;
		context.rect(0, 0, 1200, 600);
		context.fill();

		//Circle behind avatar
		context.beginPath();
		context.arc(75, 75, 55, 0, Math.PI * 2, true);
		context.fillStyle = secondaryColor;
		context.fill();

		//Name text
		context.font = applyText(canvas, `${interaction.member.displayName}!`);
		context.fillStyle = secondaryColor;
		context.fillText(`${interaction.member.displayName}`, 150, 100);

		//Orden text
		//If (orden > 9): offset = 20 else offset = 0
		let offset = (orden > 9) ? 20 : 0;
		context.font = applyText(canvas, `Orden: ${orden.toString()}`)
		context.fillStyle = secondaryColor;
		context.fillText(`Orden: ${orden.toString()}`, 900-offset, 100)

		//Separation line under the name
		context.beginPath();
		context.fillStyle = secondaryColor;
		context.rect(25, 150, 1150, 25);
		context.fill();

		//Circle for avatar
		context.beginPath();
		context.arc(75, 75, 50, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();

		//Avatar
		avatar = await Canvas.loadImage(interaction.member.displayAvatarURL({ format: 'jpg' }))
		context.drawImage(avatar, 25, 25, 100, 100);

		const attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');
		return interaction.reply({ files: [attachment] });
	},
};