import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import "./IndiaMap.css";

const STATE_INFO = {
  "Andhra Pradesh":    { capital:"Amaravati",   tagline:"Land of Spices & Spirituality",       culture:"Kuchipudi classical dance, Telugu cinema, Carnatic music traditions",  history:"Seat of Satavahana, Pallava & Vijayanagara empires — cradle of Dravidian glory", cuisine:"Andhra Biryani, Pesarattu, fiery Gongura pickle, Pulihora",          unique:"Tirupati Balaji — world's most visited religious pilgrimage",  color:"#E85D3A", icon:"🌶️" },
  "Arunachal Pradesh": { capital:"Itanagar",    tagline:"Land of the Dawn-Lit Mountains",      culture:"25+ distinct tribes, Monpa & Adi communities, Losar & Dree festivals", history:"Ancient Himalayan trade routes to Tibet; contested border mystique",         cuisine:"Thukpa, Momos, Pika Pila, smoked bamboo shoot dishes",               unique:"Tawang Monastery — 2nd largest Buddhist monastery in Asia",   color:"#2E9E5A", icon:"🏔️" },
  "Assam":             { capital:"Dispur",      tagline:"Land of Red River & Blue Hills",      culture:"Bihu dance & festival, Sattriya classical dance, Muga silk weaving",   history:"Ahom dynasty ruled 600 unbroken years — longest reign in Indian history",    cuisine:"Masor Tenga (sour fish), Duck curry, Pitha, Jolpan breakfast",       unique:"Kaziranga — home to 2/3rd of world's one-horned rhinoceros",  color:"#00897B", icon:"🦏" },
  "Bihar":             { capital:"Patna",       tagline:"Cradle of Civilisation & Enlightenment", culture:"Chhath Puja, Madhubani painting, Bihar School of Yoga",             history:"Nalanda University, Maurya & Gupta empires — birthplace of Buddhism & Jainism", cuisine:"Litti Chokha, Dal Pitha, Khaja sweets, Sattu Paratha",               unique:"Bodh Gaya — where the Buddha attained enlightenment under the Bodhi tree", color:"#EF6C00", icon:"☸️" },
  "Chhattisgarh":      { capital:"Raipur",      tagline:"Rice Bowl of Central India",          culture:"Panthi, Karma & Raut Nacha tribal dances, vibrant Bastar Dussehra",   history:"Ancient Dakshina Kosala kingdom, mentioned in the Ramayana itself",         cuisine:"Bafauri, Chila crepes, Aamat curry, Faraa, savoury Muthia",          unique:"Chitrakoot — India's widest waterfall, the Niagara of the East",color:"#8E24AA", icon:"💧" },
  "Goa":               { capital:"Panaji",      tagline:"Pearl of the Orient",                 culture:"Carnival, Shigmo festival, Goan trance music, Portuguese baroque art",  history:"Portuguese colony for 450 years — liberated by India in 1961",             cuisine:"Fish curry rice, Vindaloo, Xacuti, Bebinca layered cake, Feni",       unique:"UNESCO World Heritage churches & Portuguese-Gothic architecture",    color:"#0288D1", icon:"🏖️" },
  "Gujarat":           { capital:"Gandhinagar", tagline:"Land of Legends & Vibrant Culture",   culture:"Garba & Dandiya Raas dance, Patola silk weaving, Kutch embroidery",   history:"Birthplace of Mahatma Gandhi; ancient Harappan port of Lothal",            cuisine:"Dhokla, Thepla, Undhiyo, lavish Gujarati Thali, Fafda-Jalebi",       unique:"Rann of Kutch — world's largest white salt desert glowing under moonlight", color:"#F4511E", icon:"🧂" },
  "Haryana":           { capital:"Chandigarh",  tagline:"Land of Kurukshetra",                 culture:"Saang folk theatre, Phag dance, wrestling & Olympic sports tradition",  history:"Site of the Mahabharata war; Indus Valley Civilization at Rakhigarhi",     cuisine:"Bajra Khichdi, Hara Dhania Shorba, Besan Masala Roti, Lassi",        unique:"Surajkund Crafts Mela — Asia's largest crafts fair",          color:"#689F38", icon:"⚔️" },
  "Himachal Pradesh":  { capital:"Shimla",      tagline:"Dev Bhoomi — Land of the Gods",       culture:"Kullu Dussehra, Minjar fair, Himalayan Buddhist gompas",              history:"Ancient hill kingdoms; Summer capital of the British Raj",                 cuisine:"Dham feast, Sidu bread, Chha Gosht slow-cooked lamb, Babru",         unique:"Spiti Valley — a mystical cold desert at 12,500 ft",          color:"#1E88E5", icon:"❄️" },
  "Jharkhand":         { capital:"Ranchi",      tagline:"Land of Forests & Waterfalls",        culture:"Chhau masked dance, Sohrai tribal art, vibrant Jharkhand traditions",  history:"Home to fierce Santali & Mundari tribes; pivotal in the 1857 revolt",      cuisine:"Rugda mushroom delicacy, Chilka Roti, Handia rice beer, Litti",      unique:"39 waterfalls — the waterfall capital of India",               color:"#00897B", icon:"🌊" },
  "Karnataka":         { capital:"Bengaluru",   tagline:"One State, Many Worlds",              culture:"Yakshagana dance-theatre, Mysore Dasara, Carnatic music, Silk weaving",history:"Vijayanagara Empire splendour and Hyder Ali & Tipu Sultan's kingdom",       cuisine:"Masala Dosa, Bisi Bele Bath, Mysore Pak, Coorg Pandi Curry",         unique:"Mysore Palace — illuminated by 97,000 bulbs every Sunday",    color:"#F4511E", icon:"🏛️" },
  "Kerala":            { capital:"Thiruvananthapuram", tagline:"God's Own Country",            culture:"Kathakali dance-drama, Theyyam ritual, Onam harvest festival",          history:"Ancient spice trade with Greeks, Romans & Arabs; first church in India",    cuisine:"Kerala Sadya on banana leaf, Fish Molee, Puttu-Kadala, Appam",       unique:"Alleppey Backwaters — 900 km of canals forming a floating world",    color:"#2E7D32", icon:"🌴" },
  "Madhya Pradesh":    { capital:"Bhopal",      tagline:"The Heart of Incredible India",       culture:"Khajuraho dance festival, Gond tribal art, Tansen music festival",     history:"Khajuraho temples, Sanchi Stupa, Orchha's medieval fort city",             cuisine:"Bhutte Ka Kees, Dal Bafla, Mawa Bati, Seekh Kebab",                  unique:"Kanha & Bandhavgarh — highest tiger density in India",        color:"#AD1457", icon:"🐯" },
  "Maharashtra":       { capital:"Mumbai",      tagline:"Gateway to India's Spirit",           culture:"Bollywood, Ganesh Chaturthi, Lavani & Tamasha folk arts, Warli art",   history:"Maratha Empire under Chhatrapati Shivaji Maharaj challenged the Mughals",  cuisine:"Vada Pav, Puran Poli, Kolhapuri chicken, Modak, Misal Pav",          unique:"Ajanta & Ellora caves — UNESCO rock-cut masterpieces from 2nd century BC", color:"#D84315", icon:"🎬" },
  "Manipur":           { capital:"Imphal",      tagline:"Jewel of India",                      culture:"Manipuri classical dance, Lai Haraoba festival, Polo sport born here", history:"Ancient kingdom; the modern sport of polo originated in Manipur",           cuisine:"Eromba fermented fish, Iromba, Chamthong, Singju salad",             unique:"Loktak Lake — world's only floating national park",           color:"#00838F", icon:"🏇" },
  "Meghalaya":         { capital:"Shillong",    tagline:"Abode of Clouds",                     culture:"Nongkrem dance, matrilineal Khasi society, Shillong rock music scene", history:"Created in 1972 from Assam; ancient Khasi, Garo & Jaintia kingdoms",        cuisine:"Jadoh (rice & pork), Dohneiiong, Tungrymbai, Pumaloi",               unique:"Living root bridges — 500-year-old bridges grown from ficus roots",  color:"#5E35B1", icon:"🌉" },
  "Mizoram":           { capital:"Aizawl",      tagline:"Land of the Highlanders",             culture:"Cheraw bamboo dance, strong Christian choral tradition, Mizo choir",   history:"Annexed by British in 1891; gained full statehood in 1987",                cuisine:"Bamboo shoot dishes, Bai, Sawhchiar, Vawksa Rep smoked pork",         unique:"99% literacy — one of India's most literate states",          color:"#0097A7", icon:"🎵" },
  "Nagaland":          { capital:"Kohima",      tagline:"Land of Festivals",                   culture:"16 major tribes, Hornbill Festival — the festival of all festivals",   history:"Battle of Kohima 1944 — the turning point of WWII in the East",            cuisine:"Smoked pork, Axone fermented soybean, Galho rice-meat stew",         unique:"Hornbill Festival — 10 days of all 16 Naga tribal cultures",  color:"#EF6C00", icon:"🦅" },
  "Odisha":            { capital:"Bhubaneswar", tagline:"Soul of Incredible India",            culture:"Odissi classical dance, Pattachitra painting, grand Rath Yatra festival",history:"Kalinga Empire; Emperor Ashoka's transformation after the Kalinga War",    cuisine:"Dalma, Pakhala Bhata, Chhena Poda, Rasabali, Mudhi",                 unique:"Konark Sun Temple — a UNESCO chariot-shaped ode to the sun god",     color:"#FF8F00", icon:"🌞" },
  "Punjab":            { capital:"Chandigarh",  tagline:"Land of Five Rivers",                 culture:"Bhangra & Giddha dance, Sikh heritage, Baisakhi harvest festival",    history:"Cradle of Indus Valley Civilization; birthplace of Sikhism",              cuisine:"Sarson da Saag–Makki di Roti, Amritsari Kulcha, Lassi, Pinni",       unique:"Golden Temple — feeds 100,000 pilgrims free every single day",color:"#EF6C00", icon:"🌾" },
  "Rajasthan":         { capital:"Jaipur",      tagline:"Land of Kings — Rajputana Glory",     culture:"Ghoomar dance, Pushkar Camel Fair, Kathputli puppet theatre, miniature painting", history:"36 Rajput clans built 1000+ forts and palaces across the Thar Desert",cuisine:"Dal Baati Churma, Laal Maas mutton curry, Ghevar, Ker Sangri",       unique:"Jaisalmer Fort, Mehrangarh — India's greatest living museum",  color:"#C62828", icon:"🏰" },
  "Sikkim":            { capital:"Gangtok",     tagline:"Small Wonder of the Himalayas",       culture:"Losar & Saga Dawa Buddhist festivals, Cham masked dances",             history:"Independent Buddhist kingdom until 1975 — last Indian monarchy",            cuisine:"Momos, Thukpa, Phagshapa, Chhurpi hard cheese, Tongba millet beer",  unique:"Kanchenjunga — third highest peak, sacred & never fully summited",   color:"#283593", icon:"🏔️" },
  "Tamil Nadu":        { capital:"Chennai",     tagline:"Land of Temples & Classical Arts",    culture:"Bharatanatyam, Carnatic music, Pongal festival, Dravidian temple architecture", history:"Chola, Pandya & Pallava empires — masters of maritime trade and temple arts",cuisine:"Filter Kaapi, Idli-Sambar, Chettinad curry, Pongal, Rasam",         unique:"38,000 ancient Dravidian temples — more than any other state",color:"#B71C1C", icon:"🛕" },
  "Telangana":         { capital:"Hyderabad",   tagline:"City of Nizams & Tech",               culture:"Perini Shivatandavam dance, Bonalu festival, Kalamkari textile art",   history:"Nizam's Hyderabad — once one of the richest princely states on earth",     cuisine:"Hyderabadi Dum Biryani, Haleem, Qubani ka Meetha, Irani Chai",       unique:"Charminar — the iconic 16th-century arch & mosque of Hyderabad",     color:"#EF6C00", icon:"🕌" },
  "Tripura":           { capital:"Agartala",    tagline:"Land of Natural Beauty",              culture:"Garia Puja, Hojagiri dance, bamboo & cane handicrafts",               history:"Manikya dynasty ruled 500 years; 3rd smallest state of India",             cuisine:"Wahan Mosdeng smoked meat, Chakhwi, Gudok, Muya Awandru",            unique:"Unakoti — 9th-century rock-carved Shaivite sculptures",        color:"#388E3C", icon:"🗿" },
  "Uttar Pradesh":     { capital:"Lucknow",     tagline:"Land of Karma & Nawabi Culture",      culture:"Kathak dance, Nawabi Lucknowi culture, Ram Lila theatrical tradition",  history:"Maurya, Gupta & Mughal empires; birthplace of Rama, Krishna & the Buddha's first sermon", cuisine:"Awadhi Dum Biryani, Galouti Kebab, Sheermal bread, Peda",           unique:"Taj Mahal + Varanasi — oldest living city on earth",          color:"#1565C0", icon:"🕌" },
  "Uttaranchal":      { capital:"Dehradun",    tagline:"Dev Bhoomi — Land of Gods",           culture:"Kumaouni & Garhwali folk music, Pandav Lila, Phool Dei spring festival", history:"Ancient Kedarkhand and Manaskhand; birthplace of Ayurveda & classical Yoga",cuisine:"Kafuli greens, Bal Mithai chocolate fudge, Chainsoo, Aloo Ke Gutke",  unique:"Char Dham: Kedarnath, Badrinath, Gangotri & Yamunotri",       color:"#5E35B1", icon:"🙏" },
  "West Bengal":       { capital:"Kolkata",     tagline:"Cultural Capital of India",           culture:"Durga Puja, Rabindra Sangeet, Baul folk music, Patachitra art",        history:"Bengal Renaissance produced Tagore, Vivekananda & Raja Ram Mohan Roy",     cuisine:"Rosogolla, Hilsa fish curry, Mishti Doi, Kati Roll, Sandesh",        unique:"Sundarbans — world's largest mangrove delta, Royal Bengal Tiger home",color:"#1565C0", icon:"🎨" },
  "Delhi":             { capital:"New Delhi",   tagline:"Heart of a Nation",                   culture:"Qawwali nights, Dilli Haat crafts, Republic Day parade on Kartavya Path",history:"Capital of 7 successive empires — Delhi Sultanate, Mughals, British Raj",  cuisine:"Butter Chicken, Chole Bhature, Dahi Bhalle, Paranthe Wali Gali",     unique:"Chandni Chowk — 17th-century bazaar & densest street food lane",     color:"#7B1FA2", icon:"🏙️" },
  "Jammu & Kashmir":   { capital:"Srinagar",    tagline:"Paradise on Earth",                   culture:"Sufi music, Rouf dance, Pashmina shawl weaving, Dal Lake houseboat life",history:"Dogra kingdom; Silk Road crossroads; partition of 1947",               cuisine:"Rogan Josh, Wazwan 36-course feast, Kashmiri Pulao, Kehwa saffron tea",unique:"Dal Lake & Shalimar Bagh — Mughal paradise gardens at altitude",    color:"#0288D1", icon:"🌷" },
  "Ladakh":            { capital:"Leh",         tagline:"Land of High Passes",                 culture:"Hemis festival, Ladakhi Thangka paintings, Tibetan Buddhist culture",  history:"Ancient Silk Road kingdom; became Union Territory in 2019",                cuisine:"Tsampa barley porridge, Gur Gur butter tea, Skyu, Thukpa noodle soup",unique:"Pangong Tso — surreal blue lake at 14,270 ft on the China border",   color:"#5D4037", icon:"🏔️" },
  "Uttarakhand":       { capital:"Dehradun",    tagline:"Dev Bhoomi — Land of Gods",           culture:"Kumaouni & Garhwali folk music, Pandav Lila, Phool Dei spring festival", history:"Ancient Kedarkhand and Manaskhand; birthplace of Ayurveda & classical Yoga",cuisine:"Kafuli greens, Bal Mithai chocolate fudge, Chainsoo, Aloo Ke Gutke",  unique:"Char Dham: Kedarnath, Badrinath, Gangotri & Yamunotri",       color:"#5E35B1", icon:"🙏" },
};

const GEO_URL = "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

export default function IndiaMap() {
  const [geoData, setGeoData]     = useState(null);
  const [geoError, setGeoError]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [hovered, setHovered]     = useState(null);
  const [mapReady, setMapReady]   = useState(false);
  const svgRef  = useRef(null);
  const gRef    = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setGeoData)
      .catch(() => setGeoError(true));
  }, []);

  useEffect(() => {
    if (!geoData || !svgRef.current || !wrapRef.current) return;

    const draw = () => {
      const W = wrapRef.current.offsetWidth || 520;
      const H = 620;

      const svg = d3.select(svgRef.current).attr("width", W).attr("height", H);
      svg.selectAll("*").remove();

      /* Dark map background gradient */
      const defs = svg.append("defs");
      const grad = defs.append("radialGradient").attr("id","mapBg").attr("cx","50%").attr("cy","40%").attr("r","65%");
      grad.append("stop").attr("offset","0%").attr("stop-color","#1a1e2e");
      grad.append("stop").attr("offset","100%").attr("stop-color","#0d0f18");

      /* Glow filter */
      const filter = defs.append("filter").attr("id","glow").attr("x","-40%").attr("y","-40%").attr("width","180%").attr("height","180%");
      filter.append("feGaussianBlur").attr("stdDeviation","4").attr("result","blur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in","blur");
      merge.append("feMergeNode").attr("in","SourceGraphic");

      svg.append("rect").attr("width",W).attr("height",H).attr("fill","url(#mapBg)").attr("rx",12);

      const proj = d3.geoMercator().fitExtent([[20, 20], [W - 20, H - 20]], geoData);
      const path = d3.geoPath().projection(proj);
      const g    = svg.append("g");
      gRef.current = g;

      const hex = name => (STATE_INFO[name]?.color || "#6B8CAE");

      g.selectAll("path")
        .data(geoData.features)
        .join("path")
        .attr("d", path)
        .attr("fill", d => hex(d.properties.ST_NM) + "88")
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-width", 0.7)
        .style("cursor", "pointer")
        .style("transition", "filter 0.3s ease")
        .on("mouseenter", function(_, d) {
          const n = d.properties.ST_NM;
          d3.select(this).attr("fill", hex(n) + "dd").attr("stroke","rgba(255,255,255,0.5)").attr("stroke-width", 1.5).style("filter","url(#glow)");
          setHovered(n);
        })
        .on("mouseleave", function(_, d) {
          const n = d.properties.ST_NM;
          d3.select(this)
            .attr("fill", selected === n ? hex(n) + "ee" : hex(n) + "88")
            .attr("stroke", selected === n ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)")
            .attr("stroke-width", selected === n ? 1.5 : 0.7)
            .style("filter", selected === n ? "url(#glow)" : "none");
          setHovered(null);
        })
        .on("click", function(_, d) {
          const n = d.properties.ST_NM;
          setSelected(n);
          g.selectAll("path")
            .attr("fill", dd => {
              const dn = dd.properties.ST_NM;
              return dn === n ? hex(dn) + "ee" : hex(dn) + "40";
            })
            .attr("stroke", dd => dd.properties.ST_NM === n ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.08)")
            .attr("stroke-width", dd => dd.properties.ST_NM === n ? 1.5 : 0.5)
            .style("filter", dd => dd.properties.ST_NM === n ? "url(#glow)" : "none");
        })
        .attr("opacity", 0)
        .transition().duration(600).delay((_, i) => i * 18)
        .attr("opacity", 1)
        .on("end", (_, i, nodes) => {
          if (i === nodes.length - 1) setMapReady(true);
        });
    };

    const t = setTimeout(draw, 100);
    return () => clearTimeout(t);
  }, [geoData, selected]);

  const closePanel = useCallback(() => {
    setSelected(null);
    if (gRef.current) {
      gRef.current.selectAll("path")
        .transition().duration(300)
        .attr("fill", d => (STATE_INFO[d.properties.ST_NM]?.color || "#6B8CAE") + "88")
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-width", 0.7)
        .style("filter", "none");
    }
  }, []);

  const info = selected ? STATE_INFO[selected] : null;

  return (
    <div className="map-layout">
      {/* MAP */}
      <div className="map-canvas-wrap" ref={wrapRef}>
        {geoError ? (
          <div className="map-loading">
            <span>⚠️ Map data unavailable</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Check your internet connection</span>
          </div>
        ) : !geoData ? (
          <div className="map-loading">
            <div className="spin" />
            <span>Loading India Map…</span>
          </div>
        ) : (
          <>
            <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
            {hovered && <div className="map-hover-tag">{STATE_INFO[hovered]?.icon} &nbsp;{hovered}</div>}
            {mapReady && !hovered && !selected && (
              <div className="map-hint">↑ Click any state to explore</div>
            )}
          </>
        )}
      </div>

      {/* PANEL */}
      <div className="state-panel">
        {!selected || !info ? (
          <div className="placeholder">
            <div className="placeholder-icon">🗺️</div>
            <h3>Select a Region</h3>
            <p>Click any state on the map to discover its<br/>culture, history, cuisine &amp; heritage</p>
          </div>
        ) : (
          <div className="state-card" key={selected}>
            <div className="card-accent" style={{ "--accent": info.color, background: info.color }} />
            <div className="card-header">
              <div className="card-icon">{info.icon}</div>
              <div className="card-name">{selected}</div>
              <div className="card-capital">Capital: {info.capital}</div>
              <div className="card-tagline">{info.tagline}</div>
            </div>
            <div className="card-body">
              <div className="card-section">
                <div className="card-section-label"><span className="label-icon">🎭</span> Culture &amp; Arts</div>
                <p className="card-section-text">{info.culture}</p>
              </div>
              <div className="card-section">
                <div className="card-section-label"><span className="label-icon">📜</span> History &amp; Legacy</div>
                <p className="card-section-text">{info.history}</p>
              </div>
              <div className="card-section">
                <div className="card-section-label"><span className="label-icon">🍛</span> Cuisine &amp; Flavours</div>
                <p className="card-section-text">{info.cuisine}</p>
              </div>
              <div className="card-section">
                <div className="card-section-label"><span className="label-icon">✨</span> What Makes It Unique</div>
                <div className="card-highlight">{info.unique}</div>
              </div>
            </div>
            <button className="card-close" onClick={closePanel}>✕ &nbsp; Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
