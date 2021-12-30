const { SlashCommandBuilder } = require('@discordjs/builders');
const Canvas =  require('canvas');
const { MessageAttachment } = require('discord.js');
const pokemon = require('pokemon');
const { Sequelize, QueryTypes } = require('sequelize');

//Database connection
const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect:  'sqlite',
    storage: 'database.db',
});

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
	cooldown: 6,
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName(this.name)
		.setDescription(this.description)
		.addSubcommand(subcommand => 
            subcommand
                .setName('show')
                .setDescription('Zeigt dir dein Profil'))
		.addSubcommand(subcommand => 
            subcommand
                .setName('add')
                .setDescription('Fügt ein Pokemon oder einen Typ als deinen Favoriten zu deinem Profil hinzu.')
				.addStringOption(option =>
					option.setName('pokemon-typ')
						.setDescription('Der zu favorisierende Typ bzw. Pokemon.')
						.setRequired(true)))
		.addSubcommand(subcommand => 
			subcommand
				.setName('remove')
				.setDescription('Entfernt ein Pokemon oder einen Typ von deinen Favoriten deines Profiles.')
				.addStringOption(option =>
					option.setName('pokemon-typ')
						.setDescription('Der zu entfernende Typ bzw. Pokemon.')
						.setRequired(true))),
	async execute(interaction) {
		const sub = interaction.options.getSubcommand();
		const typen = ['normal', 'kampf', 'flug', 'gift', 'boden', 'gestein', 'käfer', 'geist', 'stahl', 'feuer', 'wasser', 'pflanze', 'elektro', 'psycho', 'eis', 'drache', 'unlicht', 'fee'];

		if(sub == 'add'){
			const arg = interaction.options.getString('pokemon-typ');
			const capitalizedArg = arg.toLowerCase().charAt(0).toUpperCase() + arg.slice(1).toLowerCase();

			if(!pokemon.all('de').includes(capitalizedArg) && !typen.includes(arg.toLowerCase())){
				return interaction.reply({ content: 'Ich habe dieses Pokemon/Typ nicht im Rotomdex gefunden. :(', ephemeral: true });
			}
	
			if(typen.includes(arg.toLowerCase())){
				//Get users favorites
				const [result, metadata] = await sequelize.query(`SELECT * FROM fav_pokemon WHERE user_id = ?`, {
					type: QueryTypes.SELECT,
					logging: false,
					replacements: [interaction.user.id]
				});

				//If user is not in db already
				if(result == null){
					await sequelize.query(`INSERT INTO fav_pokemon(user_id, fav_type1) VALUES(?, ?)`, {
						type: QueryTypes.INSERT,
						logging: false,
						replacements: [interaction.user.id, arg.toLowerCase()]
					});

					return interaction.reply({ content: `Ich habe \`${capitalizedArg}\` zu deinen Favoriten hinzugefügt.` });
				}

				if(result.fav_type1 != null && result.fav_type2 != null){
					return interaction.reply({ content: 'Jeder kann leider nur 2 Typen favorisieren. Entferne einen, falls du einen anderen hinzufügen möchtest.' });
				}
				let place;
				if(result.fav_type1 == null){
					place = 'fav_type1';
				}else{
					place = 'fav_type2';
				}

				let sql = `UPDATE fav_pokemon SET ${place} = ? WHERE user_id = ?`;
				await sequelize.query(sql, {
					type: QueryTypes.UPDATE,
					logging: false,
					replacements: [arg.toLowerCase(), interaction.user.id]
				});

				return interaction.reply({ content: `Ich habe \`${capitalizedArg}\` zu deinen Favoriten hinzugefügt.` });
			}

			if(pokemon.all('de').includes(capitalizedArg)){
				//Get pokemon id
				let pokemonId = pokemon.getId(capitalizedArg, 'de');
				let pokemonIdLong;

				if(pokemonId > 99){
					pokemonIdLong = pokemonId.toString();
				}else if(pokemonId > 9 && pokemonId < 100){
					pokemonIdLong = '0' + pokemonId.toString();
				}else{
					pokemonIdLong = '00' + pokemonId.toString();
				}

				//Get users favorites
				const [result, metadata] = await sequelize.query(`SELECT * FROM fav_pokemon WHERE user_id = ?`, {
					type: QueryTypes.SELECT,
					logging: false,
					replacements: [interaction.user.id]
				});

				//If user is not in db already
				if(result == null){
					await sequelize.query(`INSERT INTO fav_pokemon(user_id, fav1) VALUES(?, ?)`, {
						type: QueryTypes.INSERT,
						logging: false,
						replacements: [interaction.user.id, pokemonIdLong]
					});

					return interaction.reply({ content: `${capitalizedArg} wurde zu deinen Favoriten hinzugefügt!` });
				}

				//Favorites into an array
				let favorites = [];
				favorites.push(result.fav1);
				favorites.push(result.fav2);
				favorites.push(result.fav3);
				favorites.push(result.fav4);
				favorites.push(result.fav5);
				favorites.push(result.fav6);

				var pokemonPlace;
				//Iterate over array to find first null value to figure out where to save the new pokemon
				for(let i = 0; i<favorites.length; i++){
					if(favorites[i] == null){
						pokemonPlace = `fav${i+1}`;
						break;
					}
				}

				//If slots are full
				if(pokemonPlace == null){
					return interaction.reply({ content: 'Du kannst nur 6 Pokemon zu deinen Favoriten hinzufügen. Entferne eins, wenn du ein anderes hinzufügen möchtest.' });
				}

				let sql = `UPDATE fav_pokemon SET ${pokemonPlace} = ? WHERE user_id = ?`;
				await sequelize.query(sql, {
					type: QueryTypes.UPDATE,
					logging: false,
					replacements: [pokemonIdLong, interaction.user.id]
				});
				return interaction.reply({ content: `${capitalizedArg} wurde zu deinen Favoriten hinzugefügt!` });
			}

			return interaction.reply({ content: 'Ich habe dieses Pokemon/Typ nicht im Rotomdex gefunden. :(', ephemeral: true });

		}else if(sub == 'remove'){
			const arg = interaction.options.getString('pokemon-typ');
			const capitalizedArg = arg.toLowerCase().charAt(0).toUpperCase() + arg.slice(1).toLowerCase();

			if(!pokemon.all('de').includes(capitalizedArg) && !typen.includes(arg.toLowerCase())){
				return interaction.reply({ content: 'Ich habe dieses Pokemon/Typ nicht im Rotomdex gefunden. :(', ephemeral: true });
			}

			//Get users favorites
			const [result, metadata] = await sequelize.query(`SELECT * FROM fav_pokemon WHERE user_id = ?`, {
				type: QueryTypes.SELECT,
				logging: false,
				replacements: [interaction.user.id]
			});

			if(result == null){
				return interaction.reply({ content: 'Ich kann nichts entfernen, wenn nichts da ist. :(' });
			}

			if(typen.includes(arg.toLowerCase())){
				if(arg.toLowerCase() != result.fav_type1 && arg.toLowerCase() != result.fav_type2){
					return interaction.reply({ content: 'Du kannst keinen Typen von deinen Favoriten entfernen, den du nicht favorisiert hast.' });
				}

				let place;
				if(result.fav_type1 == null){
					place = 'fav_type1';
				}else{
					place = 'fav_type2';
				}
				let sql = `UPDATE fav_pokemon SET ${place} = ? WHERE user_id = ?`;
				await sequelize.query(sql, {
					type: QueryTypes.UPDATE,
					logging: false,
					replacements: [null, interaction.user.id]
				});

				return interaction.reply({ content: `Ich habe den Typ \`${capitalizedArg}\` von deinen Favoriten entfernt.` });
			}

			if(pokemon.all('de').includes(capitalizedArg)){

				//Put favorite pokemon into an array
				let favorites = [];
				favorites.push(result.fav1);
				favorites.push(result.fav2);
				favorites.push(result.fav3);
				favorites.push(result.fav4);
				favorites.push(result.fav5);
				favorites.push(result.fav6);

				let pokemonId = pokemon.getId(capitalizedArg, 'de');
				let pokemonIdLong;

				if(pokemonId > 99){
					pokemonIdLong = pokemonId.toString();
				}else if(pokemonId > 9 && pokemonId < 100){
					pokemonIdLong = '0' + pokemonId.toString();
				}else{
					pokemonIdLong = '00' + pokemonId.toString();
				}

				let ind = favorites.indexOf(pokemonIdLong);
				let sql = `UPDATE fav_pokemon SET fav${ind+1} = ? WHERE user_id = ?`;
				await sequelize.query(sql, {
					type: QueryTypes.UPDATE,
					logging: false,
					replacements: [null, interaction.user.id]
				});

				return interaction.reply({ content: `Ich habe ${capitalizedArg} erfolgreich von deinen Favoriten entfernt.` });

			}



		}else if(sub == 'show'){

			const canvas = Canvas.createCanvas(1200, 600);
			const context = canvas.getContext('2d');
	
			let orden = 0;
			let primaryColor;
			let secondaryColor;
	
			//Temporär
			let design = 'hyperball';
	
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
	
			//Circles behind the pokemon Row 1
			for(let i = 0; i<3; i++){
				context.beginPath();
				context.arc(150+(i*75)+(i*150), 300, 75, 0, Math.PI * 2, true);
				context.fillStyle = secondaryColor;
				context.fill();
			}
	
			//Circles behind the pokemon Row 2
			for(let i = 0; i<3; i++){
				context.beginPath();
				context.arc(250+(i*75)+(i*150), 475, 75, 0, Math.PI * 2, true);
				context.fillStyle = secondaryColor;
				context.fill();
			}
	
			//Get users favorites
			const [result, metadata] = await sequelize.query(`SELECT * FROM fav_pokemon WHERE user_id = ?`, {
				type: QueryTypes.SELECT,
				logging: false,
				replacements: [interaction.user.id]
			});

			if(result != null){
				//Put favorite pokemon into an array
				let favorites = [];
				favorites.push(result.fav1);
				favorites.push(result.fav2);
				favorites.push(result.fav3);
				favorites.push(result.fav4);
				favorites.push(result.fav5);
				favorites.push(result.fav6);


				var moved = false;
				//Iterate over array to add Pokemon to the canvas
				for(let i = 0; i<favorites.length; i++){
					//To check if previous pokemon was null, to move the following pokemon to the front
					let localI = i;
					if(i>0){
						if(favorites[i-1] == null || moved == true){
							localI = i-1;
							moved = true;
						}else{
							moved = false;
						}
					}

					//Skip if value is null
					if(favorites[i] == null) continue;
					
					let url = `https://media.bisafans.de/6ff97ef//pokemon/artwork/${favorites[i]}.png`;
					sprite = await Canvas.loadImage(url);

					if(localI<3){
						context.drawImage(sprite, 75+(localI*225), 225, 150, 150);
					}else{
						context.drawImage(sprite, 175+((localI-3)*225), 400, 150, 150);
					}
				}

				//Typen
				let favoriteTypes = [];
				favoriteTypes.push(result.fav_type1);
				favoriteTypes.push(result.fav_type2);

				for(let i = 0; i<favoriteTypes.length; i++){
					//To check if previous type was null, to move the following types to the front
					let localI = i;
					if(i>0){
						if(favoriteTypes[i-1] == null || moved == true){
							localI = i-1;
							moved = true;
						}else{
							moved = false;
						}
					}

					//Skip if value is null
					if(favoriteTypes[i] == null) continue;

					//Little rectangle behind types
					context.beginPath();
					context.fillStyle = secondaryColor;
					context.rect(744, 225+(i*75), 108, 48);
					context.fill();

					let url = `https://media.bisafans.de/6ff97ef/typen/${favoriteTypes[i]}.png`;
					sprite = await Canvas.loadImage(url);

					context.drawImage(sprite, 750, 225+(i*75)+3, 96, 42);
				}

				//https://media.bisafans.de/6ff97ef//pokemon/artwork/001.png sprites
				//https://media.bisafans.de/6ff97ef/typen/pflanze.png typen sprites
			}

			//Circle for avatar
			context.beginPath();
			context.arc(75, 75, 50, 0, Math.PI * 2, true);
			context.closePath();
			context.clip();
	
			//Avatar
			avatar = await Canvas.loadImage(interaction.member.displayAvatarURL({ format: 'jpg' }));
			context.drawImage(avatar, 25, 25, 100, 100);
	
			const attachment = new MessageAttachment(canvas.toBuffer(), 'profile-image.png');
			return interaction.reply({ files: [attachment] });
		}
	},
};