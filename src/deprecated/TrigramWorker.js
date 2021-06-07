import Trigram from './Trigram';
onmessage = e => {
	postMessage(Trigram(e.data));
}