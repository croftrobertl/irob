/* iRob's drawn cat (SVG): a sitting cat with expressions and a curled-up sleeping cat.
   Used by the Pocket kitten and by the kitten that naps on buttons. Coat colours come from a palette so each kitten can look different. */
(() => {
'use strict';
const COATS = {
  grey:   {fur:'#9aa1ab', dark:'#6c727c', light:'#c9ced5', cream:'#eceae6', stripe:'#5d636c'},
  orange: {fur:'#e3a25a', dark:'#b8722f', light:'#f3c98f', cream:'#fbf1e3', stripe:'#a9612a'},
  tabby:  {fur:'#a58a6a', dark:'#76604a', light:'#cdb393', cream:'#f1e9dd', stripe:'#5e4a37'},
  black:  {fur:'#3a3a40', dark:'#222226', light:'#5a5a62', cream:'#5a5a62', stripe:'#2a2a30'},
};
let n = 0;
// Sitting cat, facing you. mood: open | closed | happy | sad | wide
function sitting(coat = 'grey', mood = 'open'){
  const c = COATS[coat] || COATS.grey, id = 'c' + (++n);
  const eyes = {
    open:`<g class="eye"><ellipse cx="82" cy="80" rx="9.5" ry="10.5" fill="#a9c96b"/><ellipse cx="82" cy="80" rx="3.3" ry="8.4" fill="#1d1d1f"/><circle cx="85" cy="76" r="2.4" fill="#fff"/></g><g class="eye"><ellipse cx="118" cy="80" rx="9.5" ry="10.5" fill="#a9c96b"/><ellipse cx="118" cy="80" rx="3.3" ry="8.4" fill="#1d1d1f"/><circle cx="121" cy="76" r="2.4" fill="#fff"/></g>`,
    wide:`<ellipse cx="82" cy="80" rx="11" ry="12" fill="#a9c96b"/><circle cx="82" cy="81" r="8" fill="#1d1d1f"/><circle cx="86" cy="76" r="3" fill="#fff"/><ellipse cx="118" cy="80" rx="11" ry="12" fill="#a9c96b"/><circle cx="118" cy="81" r="8" fill="#1d1d1f"/><circle cx="122" cy="76" r="3" fill="#fff"/>`,
    closed:`<path d="M72 81 Q82 87 92 81M108 81 Q118 87 128 81" fill="none" stroke="${c.stripe}" stroke-width="3" stroke-linecap="round"/>`,
    happy:`<path d="M72 84 Q82 72 92 84M108 84 Q118 72 128 84" fill="none" stroke="${c.stripe}" stroke-width="3" stroke-linecap="round"/>`,
    sad:`<ellipse cx="82" cy="82" rx="8.5" ry="9" fill="#a9c96b"/><circle cx="82" cy="83" r="5.5" fill="#1d1d1f"/><circle cx="84" cy="79" r="2.2" fill="#fff"/><ellipse cx="118" cy="82" rx="8.5" ry="9" fill="#a9c96b"/><circle cx="118" cy="83" r="5.5" fill="#1d1d1f"/><circle cx="120" cy="79" r="2.2" fill="#fff"/><path d="M71 70 L90 74M129 70 L110 74" stroke="${c.stripe}" stroke-width="2.6" stroke-linecap="round"/>`,
  }[mood] || '';
  return `<svg class="cat-svg sit" viewBox="0 0 200 222" aria-hidden="true">
  <defs><radialGradient id="${id}f" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.fur}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient></defs>
  <ellipse cx="100" cy="212" rx="70" ry="8" fill="rgba(0,0,0,.12)"/>
  <path class="tail" d="M138 196 C186 192 196 150 176 124 C168 114 154 118 160 128 C176 150 170 176 132 180Z" fill="${c.fur}" stroke="${c.dark}" stroke-width="1.5"/>
  <path d="M164 136 l8 -6 M168 152 l9 -3 M164 170 l8 2" stroke="${c.stripe}" stroke-width="3" stroke-linecap="round" opacity=".55"/>
  <path d="M58 204 C48 152 62 112 100 106 C138 112 152 152 142 204 Z" fill="url(#${id}f)"/>
  <path d="M84 122 C92 142 108 142 116 122 C114 154 111 178 100 190 C89 178 86 154 84 122Z" fill="${c.cream}" opacity=".95"/>
  <path d="M64 150 q8 4 12 0 M62 168 q8 4 12 0 M136 150 q-8 4 -12 0 M138 168 q-8 4 -12 0" stroke="${c.stripe}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>
  <ellipse cx="80" cy="204" rx="17" ry="9.5" fill="${c.cream}" stroke="${c.dark}" stroke-width="1"/><ellipse cx="120" cy="204" rx="17" ry="9.5" fill="${c.cream}" stroke="${c.dark}" stroke-width="1"/>
  <path d="M74 206v4M80 207v4M86 206v4M114 206v4M120 207v4M126 206v4" stroke="${c.dark}" stroke-width="1.2" opacity=".6"/>
  <g class="head">
    <path class="ear l" d="M60 66 L56 20 L92 44Z" fill="${c.fur}" stroke="${c.dark}" stroke-width="1.5" stroke-linejoin="round"/><path d="M64 58 L62 31 L83 45Z" fill="#e9a6ad"/>
    <path class="ear r" d="M140 66 L144 20 L108 44Z" fill="${c.fur}" stroke="${c.dark}" stroke-width="1.5" stroke-linejoin="round"/><path d="M136 58 L138 31 L117 45Z" fill="#e9a6ad"/>
    <path d="M52 82 C52 50 74 38 100 38 C126 38 148 50 148 82 C148 108 126 122 100 122 C74 122 52 108 52 82Z" fill="url(#${id}f)" stroke="${c.dark}" stroke-width="1.2"/>
    <path d="M100 42 v14 M90 44 l3 11 M110 44 l-3 11" stroke="${c.stripe}" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>
    <ellipse cx="100" cy="102" rx="22" ry="15" fill="${c.cream}" opacity=".9"/>
    <ellipse cx="70" cy="96" rx="9" ry="5" fill="#f2a7ae" opacity=".35"/><ellipse cx="130" cy="96" rx="9" ry="5" fill="#f2a7ae" opacity=".35"/>
    ${eyes}
    <path d="M95 93 h10 l-5 6z" fill="#e48b97" stroke="#c86c79" stroke-width=".8" stroke-linejoin="round"/>
    <path d="M100 99 q0 6 -6 7 M100 99 q0 6 6 7" fill="none" stroke="${c.stripe}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M86 100 L54 95 M86 104 L55 107 M114 100 L146 95 M114 104 L145 107" stroke="#f5f2ec" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>
  </g></svg>`;
}
// Curled up asleep, seen from the side. Breathes via CSS.
function sleeping(coat = 'grey'){
  const c = COATS[coat] || COATS.grey, id = 'c' + (++n);
  return `<svg class="cat-svg sleep" viewBox="0 0 220 132" aria-hidden="true">
  <defs><radialGradient id="${id}s" cx="55%" cy="30%" r="80%"><stop offset="0" stop-color="${c.light}"/><stop offset=".55" stop-color="${c.fur}"/><stop offset="1" stop-color="${c.dark}"/></radialGradient></defs>
  <ellipse cx="112" cy="124" rx="96" ry="7" fill="rgba(0,0,0,.14)"/>
  <g class="breath">
    <path d="M28 96 C24 56 70 32 122 34 C176 36 210 62 204 96 C200 118 168 124 118 124 C70 124 32 118 28 96Z" fill="url(#${id}s)" stroke="${c.dark}" stroke-width="1.4"/>
    <path d="M120 40 q6 14 0 26 M146 44 q8 14 2 28 M170 54 q8 12 2 24 M96 42 q-4 12 0 22" stroke="${c.stripe}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>
  </g>
  <path class="tail" d="M196 98 C206 120 150 132 100 128 C70 126 46 120 40 110 C52 118 120 124 166 114 C182 110 190 104 196 98Z" fill="${c.fur}" stroke="${c.dark}" stroke-width="1.3"/>
  <path d="M150 120 l3 -7 M128 124 l2 -7 M106 125 l1 -7" stroke="${c.stripe}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
  <ellipse cx="66" cy="114" rx="22" ry="8" fill="${c.cream}" stroke="${c.dark}" stroke-width="1"/>
  <g class="head">
    <path d="M38 58 L32 30 L58 46Z" fill="${c.fur}" stroke="${c.dark}" stroke-width="1.3" stroke-linejoin="round"/><path d="M41 52 L38 38 L52 47Z" fill="#e9a6ad"/>
    <path d="M86 50 L98 26 L102 56Z" fill="${c.fur}" stroke="${c.dark}" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M24 82 C22 58 44 44 68 45 C92 46 108 60 106 82 C104 102 86 112 64 111 C40 110 26 100 24 82Z" fill="url(#${id}s)" stroke="${c.dark}" stroke-width="1.2"/>
    <path d="M60 50 v10 M70 49 v10" stroke="${c.stripe}" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    <ellipse cx="64" cy="96" rx="20" ry="12" fill="${c.cream}" opacity=".85"/>
    <path d="M42 80 Q50 86 58 80 M72 80 Q80 86 88 80" fill="none" stroke="${c.stripe}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M60 89 h8 l-4 5z" fill="#e48b97"/>
    <path d="M52 96 L26 94 M52 99 L28 103 M78 96 L102 92 M78 99 L101 101" stroke="#f5f2ec" stroke-width="1" opacity=".85"/>
  </g></svg>`;
}
const COAT_NAMES = Object.keys(COATS);
window.iRobCat = {sitting, sleeping, COATS:COAT_NAMES};
})();
