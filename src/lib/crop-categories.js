/**
 * Master Crop Categories and Crops Taxonomy for FarmWise AI Marketplace
 * Multilingual metadata ready for all 11 supported languages.
 */

export const INITIAL_CROP_CATEGORIES = [
  {
    slug: "food-grains",
    icon: "🌾",
    order: 1,
    name: {
      en: "Food Grains",
      hi: "अनाज",
      mr: "धान्य",
      pa: "ਅਨਾਜ",
      bn: "খাদ্য শস্য",
      ta: "தானியங்கள்",
      te: "ధాన్యాలు",
      gu: "અનાજ",
      kn: "ಧಾನ್ಯಗಳು",
      ml: "ധാന്യങ്ങൾ",
      or: "ଶସ୍ୟ"
    },
    popularCrops: [
      { name: "Wheat", varieties: ["Sharbati", "Lokwan", "Sonalika", "HD-2967", "PBW-343", "Kalyan Sona", "Desi"] },
      { name: "Paddy / Rice", varieties: ["Basmati 1121", "Pusa Basmati", "Sona Masoori", "IR 64", "Swarna", "Govindobhog", "Kolam"] },
      { name: "Maize / Corn", varieties: ["Sweet Corn", "Yellow Corn", "White Corn", "Baby Corn", "Hybrid 108"] },
      { name: "Barley / Jau", varieties: ["RD 2552", "K 551", "Azad"] },
      { name: "Bajra / Pearl Millet", varieties: ["Desi Bajra", "Hybrid Bajra", "HHB 67"] },
      { name: "Jowar / Sorghum", varieties: ["Maldandi", "CSH 16", "White Jowar", "Yellow Jowar"] },
      { name: "Ragi / Finger Millet", varieties: ["GPU 28", "Indaf 5", "Brown Ragi"] }
    ]
  },
  {
    slug: "pulses",
    icon: "🥣",
    order: 2,
    name: {
      en: "Pulses & Lentils",
      hi: "दालें",
      mr: "डाळी",
      pa: "ਦਾਲਾਂ",
      bn: "ডাল",
      ta: "பருப்பு வகைகள்",
      te: "పప్పు ధాన్యాలు",
      gu: "કઠોળ",
      kn: "ಬೇಳೆಕಾಳುಗಳು",
      ml: "പയറുവർഗ്ഗങ്ങൾ",
      or: "ଡାଲି ଜାତୀୟ"
    },
    popularCrops: [
      { name: "Chana / Chickpea / Bengal Gram", varieties: ["Desi Chana", "Kabuli Chana", "Dollar Chana", "JG 11"] },
      { name: "Tur / Arhar / Pigeon Pea", varieties: ["Maruti", "Asha", "Desi Red Tur", "White Tur"] },
      { name: "Moong / Green Gram", varieties: ["Shiny Moong", "Samrat", "Desi Green Moong", "Pusa Vishal"] },
      { name: "Urad / Black Gram", varieties: ["Pant U 31", "T 9", "Nayagarh Black Urad"] },
      { name: "Masoor / Red Lentil", varieties: ["Mala", "PL 406", "Small Red Masoor"] },
      { name: "Rajma / Kidney Beans", varieties: ["Chitra", "Red Kidney Beans", "Kashmiri Rajma"] },
      { name: "Soybean", varieties: ["JS 335", "JS 9560", "NRC 37"] }
    ]
  },
  {
    slug: "vegetables",
    icon: "🥬",
    order: 3,
    name: {
      en: "Vegetables",
      hi: "सब्जियां",
      mr: "भाज्या",
      pa: "ਸਬਜ਼ੀਆਂ",
      bn: "শাকসবজি",
      ta: "காய்கறிகள்",
      te: "కూరగాయలు",
      gu: "શાકભાજી",
      kn: "ತರಕಾರಿಗಳು",
      ml: "പച്ചക്കറികൾ",
      or: "ପନିପରିବା"
    },
    popularCrops: [
      { name: "Tomato", varieties: ["Hybrid Vaishali", "Abhinav", "Desi Tomato", "Cherry Tomato", "Himsona"] },
      { name: "Potato", varieties: ["Kufri Jyoti", "Kufri Pukhraj", "Kufri Chipsona", "Desi Red Potato", "Chandramukhi"] },
      { name: "Onion", varieties: ["Nashik Red", "Garwa Onion", "White Onion", "Shallots (Sambar)", "Bhima Super"] },
      { name: "Garlic", varieties: ["Yamuna Safed", "G 282", "Ooty Garlic", "Desi Garlic"] },
      { name: "Green Chilli", varieties: ["G4", "Jwala", "Teja", "Kanthari", "Bullet Chilli"] },
      { name: "Ginger", varieties: ["Maran", "Rio de Janeiro", "Nadia", "Mahim"] },
      { name: "Cabbage", varieties: ["Golden Acre", "Pride of India", "Green Express"] },
      { name: "Cauliflower", varieties: ["Pusa Deepali", "Snowball 16", "Hybrid Madhuri"] },
      { name: "Brinjal / Eggplant", varieties: ["Pusa Purple", "Bhanta (Round)", "Manjari Gota", "Green Long"] }
    ]
  },
  {
    slug: "fruits",
    icon: "🍎",
    order: 4,
    name: {
      en: "Fruits",
      hi: "फल",
      mr: "फळे",
      pa: "ਫਲ",
      bn: "ফলমূল",
      ta: "பழங்கள்",
      te: "పండ్లు",
      gu: "ફળો",
      kn: "ಹಣ್ಣುಗಳು",
      ml: "പഴങ്ങൾ",
      or: "ଫଳ"
    },
    popularCrops: [
      { name: "Mango", varieties: ["Alphonso (Hapus)", "Kesar", "Dasheri", "Banganapalli", "Langra", "Chaunsa", "Totapuri"] },
      { name: "Banana", varieties: ["Grand Naine (G9)", "Robusta", "Yelakki", "Red Banana", "Nendran"] },
      { name: "Apple", varieties: ["Royal Delicious", "Golden Delicious", "Kashmiri Ambri", "Gala", "Fuji"] },
      { name: "Grapes", varieties: ["Thompson Seedless", "Tas-A-Ganesh", "Sharad Seedless", "Sonaka", "Flame Seedless"] },
      { name: "Pomegranate", varieties: ["Bhagwa", "Arakta", "Ganesh", "Ruby"] },
      { name: "Orange / Citrus", varieties: ["Nagpur Mandarin", "Kinnow", "Mosambi (Sweet Lime)", "Coorg Orange"] },
      { name: "Papaya", varieties: ["Red Lady 786", "Taiwan 786", "Coimbatore 7", "Pusa Dwarf"] },
      { name: "Guava", varieties: ["Allahabad Safeda", "Sardar (L-49)", "VNR Bihi", "Arka Mridula"] }
    ]
  },
  {
    slug: "oilseeds",
    icon: "🌻",
    order: 5,
    name: {
      en: "Oilseeds",
      hi: "तिलहन",
      mr: "गळित धान्य",
      pa: "ਤੇਲ ਬੀਜ",
      bn: "তৈলবীজ",
      ta: "எண்ணெய் வித்துக்கள்",
      te: "నూనె గింజలు",
      gu: "તેલીબિયાં",
      kn: "ಎಣ್ಣೆಕಾಳುಗಳು",
      ml: "എണ്ണക്കുരുക്കൾ",
      or: "ତୈଳବୀଜ"
    },
    popularCrops: [
      { name: "Mustard / Sarson", varieties: ["Pusa Mustard 25", "Giriraj", "RH 749", "Black Mustard (Rai)"] },
      { name: "Groundnut / Peanut", varieties: ["TMV 2", "TAG 24", "Kadiri 6", "Spanish Peanut", "Bold Groundnut"] },
      { name: "Sunflower", varieties: ["KBSH 44", "DRSH 1", "Morden", "Hybrid Sun"] },
      { name: "Sesame / Til", varieties: ["White Til", "Black Til", "RT 351", "Guj Til 2"] },
      { name: "Castor", varieties: ["GCH 7", "DCH 519", "Aruna"] }
    ]
  },
  {
    slug: "cash-crops",
    icon: "🌿",
    order: 6,
    name: {
      en: "Cash Crops",
      hi: "नकदी फसलें",
      mr: "व्यापारी पिके",
      pa: "ਨਕਦੀ ਫਸਲਾਂ",
      bn: "অর্থকরী ফসল",
      ta: "பணப்பயிர்கள்",
      te: "వాణిజ్య పంటలు",
      gu: "રોકડિયા પાકો",
      kn: "ವಾಣಿಜ್ಯ ಬೆಳೆಗಳು",
      ml: "നാണ്യവിളകൾ",
      or: "ଅର୍ଥକାରୀ ଫସଲ"
    },
    popularCrops: [
      { name: "Cotton / Kapas", varieties: ["Bt Cotton (Bollgard II)", "Suvin", "Shankar 6", "DCH 32"] },
      { name: "Sugarcane", varieties: ["Co 0238", "Co 86032", "CoM 0265", "CoLK 94184"] },
      { name: "Jute", varieties: ["JRO 524", "JRO 204", "Golden Jute"] },
      { name: "Tobacco", varieties: ["Virginia Flue Cured (VFC)", "Natu Tobacco", "Bidi Tobacco"] }
    ]
  },
  {
    slug: "spices",
    icon: "🌶️",
    order: 7,
    name: {
      en: "Spices & Condiments",
      hi: "मसाले",
      mr: "मसाले",
      pa: "ਮਸਾਲੇ",
      bn: "মশলাপাতি",
      ta: "மசாலா பொருட்கள்",
      te: "మసాలా దినుసులు",
      gu: "મસાલા",
      kn: "ಮಸಾಲೆ ಪದಾರ್ಥಗಳು",
      ml: "സുഗന്ധവ്യഞ്ജനങ്ങൾ",
      or: "ମସଲା"
    },
    popularCrops: [
      { name: "Turmeric / Haldi", varieties: ["Salem", "Prathiba", "Duggirala", "Lakadong", "Waigaon"] },
      { name: "Black Pepper", varieties: ["Panniyur 1", "Karimunda", "Malabar Pepper"] },
      { name: "Cardamom / Elaichi", varieties: ["Green Cardamom (Alleppey)", "Mysore Cardamom", "Large Cardamom (Sikkim)"] },
      { name: "Cumin / Jeera", varieties: ["GC 4", "RZ 19", "RZ 209"] },
      { name: "Coriander Seeds / Dhaniya", varieties: ["Pant Haritima", "Sadhana", "Kumbhraj"] },
      { name: "Fennel / Saunf", varieties: ["GF 11", "RF 125", "Abu Saunf"] },
      { name: "Fenugreek / Methi", varieties: ["Pusa Early Bunching", "Kasuri Methi", "Rmt 1"] }
    ]
  },
  {
    slug: "other",
    icon: "🌱",
    order: 8,
    name: {
      en: "Other Agricultural Crops",
      hi: "अन्य कृषि उपज",
      mr: "इतर कृषी उत्पादने",
      pa: "ਹੋਰ ਖੇਤੀਬਾੜੀ ਉਪਜ",
      bn: "অন্যান্য কৃষিজাত পণ্য",
      ta: "மற்ற விவசாய பொருட்கள்",
      te: "ఇతర వ్యవసాయ ఉత్పత్తులు",
      gu: "અન્ય કૃષિ ઉપજ",
      kn: "ಇತರ ಕೃಷಿ ಉತ್ಪನ್ನಗಳು",
      ml: "മറ്റു കാർഷിക ഉൽപ്പന്നങ്ങൾ",
      or: "ଅନ୍ୟାନ୍ୟ କୃଷି ଉତ୍ପାଦ"
    },
    popularCrops: [
      { name: "Mushroom", varieties: ["Button Mushroom", "Oyster Mushroom", "Milky Mushroom"] },
      { name: "Medicinal & Aromatic Plants", varieties: ["Ashwagandha", "Lemongrass", "Aloevera", "Tulsi", "Stevia"] },
      { name: "Fodder Crops", varieties: ["Lucerne", "Berseem", "Napier Grass", "Sorghum Fodder"] },
      { name: "Honey (Farm Produced)", varieties: ["Mustard Flora", "Multiflora", "Acacia Honey", "Eucalyptus Honey"] }
    ]
  }
];

export function getCategoryBySlug(slug) {
  if (!slug) return null;
  return INITIAL_CROP_CATEGORIES.find((cat) => cat.slug === slug) || null;
}

export function getAllCategories() {
  return INITIAL_CROP_CATEGORIES;
}

export function getAllCropNames() {
  const set = new Set();
  for (const cat of INITIAL_CROP_CATEGORIES) {
    for (const crop of cat.popularCrops) {
      set.add(crop.name);
    }
  }
  return Array.from(set).sort();
}
