import Snowball from 'modules/core/libs/Snowball';

let result = {};
let stemmer = new Snowball('Russian');
let asTrigrams = function(phrase, callback) {
	let spl = (phrase || '').toLowerCase().split(' ');
	spl = spl.filter(function (str) {
		return str.length > 1;
	});
	spl.forEach(function (val) {
		stemmer.setCurrent(val);
		stemmer.stem();
		val = stemmer.getCurrent();
		val = " ".concat(val, " ");
		for (let i = val.length - 3; i >= 0; i = i - 1) {
			callback.call(this, val.slice(i, i + 3));
		}
	}, this);
};

let calc = data =>{
	data.forEach(function (val, key) {
		asTrigrams.call(this, val, function (trigram) {
			var phrasesForTrigram = result[trigram];
			if (!phrasesForTrigram) phrasesForTrigram = [];
			if (phrasesForTrigram.indexOf(key) < 0) phrasesForTrigram.push(key);
			result[trigram] = phrasesForTrigram;
		});
	});
	return result;
};

export default calc;