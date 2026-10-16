/* Longshot 3D · story.js · your handler's briefing for each contract, one storyline across all 24 */
'use strict';
const STORY=[
 "Welcome to the team, Longshot. Two lookouts for the Larkspur crew are watching a drop in the plaza. Clear them and the drop is ours.",
 "Larkspur moves product through a logging camp upstate. Three guards. The trees will give you more trouble than they will.",
 "The farm is their staging yard. Big sky, bigger wind. Read the flags before you read the targets.",
 "Their money men are celebrating on a rooftop tonight. The guests are innocent. Keep it clean.",
 "They put a spotter in the old fire tower. He's good. Assume he's looking for you too.",
 "Shipment day at the harbor. Four handlers on the stacks. Stop them before the container sails.",
 "Their accountant works late in the glass tower, and so do his guards. Rain tonight.",
 "The loggers are back at camp after dark. Five of them, and someone on the ridge with a rifle.",
 "A courier is carrying their ledger through the docks. White suit, briefcase. Do not lose him.",
 "The ledger points back to the farm. The wind up there today is something else.",
 "They've cut power to the whole district to cover a meeting. They think the dark protects them.",
 "Their boss is in the office tower for one last meeting. Two snipers on the street. This is the big one.",
 "The boss's deputy wants to come over to our side, and Larkspur knows it. Keep him alive to the end of the street.",
 "The boss slipped out of the city and he's driving the county road. One car, one chance.",
 "Close work now. What's left of the crew is holed up in the garage across from us. They'll shoot back.",
 "Their stock is in a warehouse. We've got you on the roof over the skylight. Short range, lots of cover.",
 "They've taken over floors of a hotel. Six guns on the balconies. Mind the glass.",
 "Their new boss is leaving town by subway at rush hour. White suit. Don't let him board.",
 "The last of the city crew is in the apartment block across the street. Watch the windows.",
 "Larkspur's backers run a base in the mountains. Snow, wind, and a sniper who knows the valley.",
 "The money ends up in a compound in the desert. The financier is inside. The heat will play tricks at range.",
 "The financier's partner is at the big game tonight, in a crowd of fifty thousand. No mistakes. None.",
 "The partner's crew has gone to ground in a quiet suburb. Hedges, pools, fences. Be patient.",
 "Last job. What's left of Larkspur is crossing the river bridge at midnight. Finish it, Longshot."
];
function storyHtml(i){ const line=STORY[i]; return line?`<div class="handler"><b>ASH, YOUR HANDLER</b><span>${line}</span></div>`:''; }
