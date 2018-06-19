import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';

autocomplete( $('#address'), $('#lat'), $('#lng'), $('#city') );
autocomplete( $('#city') );
autocomplete( $('#country') );
autocomplete( $('#state') );

typeAhead( $('.search') );
makeMap( $('#map') );
makeMap( $('#qibla') );


const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);
