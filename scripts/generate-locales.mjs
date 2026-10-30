import fs from "fs";
import path from "path";

const localesDir = path.resolve("./src/i18n/locales");

// Load English base template
const en = JSON.parse(fs.readFileSync(path.join(localesDir, "en.json"), "utf8"));

// Define regional language translation maps for Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Odia
const REGIONAL_TRANSLATIONS = {
  bn: {
    // Bengali (বাংলা)
    appName: "ফার্মওয়াইজ এআই (FarmWise AI)",
    home: "হোম",
    marketplace: "কৃষি বাজার",
    buyCrops: "শস্য কিনুন",
    sellCrops: "শস্য বিক্রি করুন",
    diagnose: "রোগ নির্ণয়",
    community: "কমিউনিটি সতর্কতা",
    history: "ইতিহাস",
    profile: "প্রোফাইল",
    login: "সাইন ইন",
    register: "নিবন্ধন করুন",
    logout: "লগ আউট",
    dashboard: "ড্যাশবোর্ড",
    myListings: "আমার ফসল",
    saved: "সংরক্ষিত",
    notifications: "বিজ্ঞপ্তি",
    admin: "অ্যাডমিন প্যানেল",
    about: "আমাদের সম্পর্কে",
    contact: "যোগাযোগ",
    save: "সংরক্ষণ করুন",
    cancel: "বাতিল করুন",
    submit: "জমা দিন",
    search: "অনুসন্ধান",
    filter: "ফিল্টার",
    loading: "লোড হচ্ছে...",
    retry: "পুনরায় চেষ্টা করুন",
    all: "সকল",
    viewDetails: "বিস্তারিত দেখুন",
    back: "পেছনে",
    farmerDashboard: "কৃষক ড্যাশবোর্ড",
    buyerDashboard: "ক্রেতা ড্যাশবোর্ড",
    postListing: "বিক্রির জন্য ফসল যুক্ত করুন",
    recentAnalyses: "সাম্প্রতিক বিশ্লেষণ",
    heroTitle: "ফার্মওয়াইজ এআই",
    heroSubtitle: "এআই-চালিত কৃষি রোগ নির্ণয় ও সরাসরি শস্য বাজার",
    heroDesc: "ফসলের রোগ দ্রুত শনাক্ত করুন এবং সমগ্র ভারতের পাইকারি ক্রেতাদের সাথে সরাসরি যুক্ত হন।",
    ctaDiagnose: "ফসল পরীক্ষা করুন",
    ctaMarketplace: "কৃষি বাজার দেখুন",
    marketTitle: "কৃষি পণ্য বাজার (Marketplace)",
    marketSub: "ভারতের কৃষক ও পাইকারি ক্রেতাদের সরাসরি সংযোগ। তাজা ফসল, স্বচ্ছ দাম, মধ্যস্বত্বভোগী মুক্ত।",
    searchPlaceholder: "ফসল (যেমন গম, ধান, আলু), জাত বা জেলা অনুসারে খুঁজুন...",
    pricePerQuintal: "প্রতি কুইন্টাল",
    availableQuantity: "উপলব্ধ পরিমাণ",
    quintals: "কুইন্টাল",
    tonnes: "টন",
    contactSeller: "বিক্রেতার সাথে যোগাযোগ",
    callSeller: "কল করুন",
    whatsappSeller: "হোয়াটসঅ্যাপ করুন",
    loginToViewContact: "যোগাযোগের নম্বর দেখতে সাইন ইন করুন",
    saveListing: "সংরক্ষণ করুন",
    sellTitle: "বিক্রির জন্য ফসল তালিকাভুক্ত করুন",
    sellSub: "আপনার উৎপাদিত ফসল ভারতের হাজার হাজার পাইকারি ক্রেতার সামনে তুলে ধরুন।"
  },
  ta: {
    // Tamil (தமிழ்)
    appName: "பார்ம்வைஸ் ஏஐ (FarmWise AI)",
    home: "முகப்பு",
    marketplace: "விவசாய சந்தை",
    buyCrops: "பயிர் வாங்க",
    sellCrops: "பயிர் விற்க",
    diagnose: "நோய் கண்டறிதல்",
    community: "சமூக எச்சரிக்கை",
    history: "வரலாறு",
    profile: "சுயவிவரம்",
    login: "உள்நுழைய",
    register: "பதிவு செய்க",
    logout: "வெளியேறு",
    dashboard: "டாஷ்போர்டு",
    myListings: "என் பயிர்கள்",
    saved: "சேமிக்கப்பட்டவை",
    notifications: "அறிவிப்புகள்",
    admin: "நிர்வாக குழு",
    about: "எங்களை பற்றி",
    contact: "தொடர்பு",
    save: "சேமி",
    cancel: "ரத்து செய்",
    submit: "சமர்ப்பி",
    search: "தேடு",
    filter: "வடிகட்டு",
    loading: "ஏற்றுகிறது...",
    retry: "மீண்டும் முயற்சிக்கவும்",
    all: "அனைத்தும்",
    viewDetails: "விவரங்களை காண்க",
    back: "பின்செல்",
    farmerDashboard: "விவசாயி டாஷ்போர்டு",
    buyerDashboard: "மொத்த வியாபாரி டாஷ்போர்டு",
    postListing: "விற்பனைக்கு பயிர் சேர்க்க",
    recentAnalyses: "சமீபத்திய சோதனைகள்",
    heroTitle: "பார்ம்வைஸ் ஏஐ",
    heroSubtitle: "ஏஐ பயிர் நோய் கண்டறிதல் மற்றும் நேரடி விவசாய சந்தை",
    heroDesc: "பயிர் நோய்களை உடனடியாக கண்டறிந்து, இந்தியா முழுவதும் உள்ள மொத்த வியாபாரிகளுடன் நேரடியாக இணையுங்கள்.",
    ctaDiagnose: "பயிரை பரிசோதிக்கவும்",
    ctaMarketplace: "சந்தையை பார்வையிடவும்",
    marketTitle: "விவசாய விளைபொருள் சந்தை (Marketplace)",
    marketSub: "விவசாயிகளும் மொத்த வியாபாரிகளும் நேரடியாக வர்த்தகம் செய்யலாம். இடைத்தரகர் இல்லை.",
    searchPlaceholder: "பயிர் (எ.கா. நெல், தக்காளி), வகை அல்லது மாவட்டம் மூலம் தேடவும்...",
    pricePerQuintal: "ஒரு குவிண்டாலுக்கு",
    availableQuantity: "கிடைக்கும் அளவு",
    quintals: "குவிண்டால்",
    tonnes: "டன்",
    contactSeller: "விற்பனையாளரை தொடர்பு கொள்ள",
    callSeller: "அழைக்கவும்",
    whatsappSeller: "வாட்ஸ்அப் செய்க",
    loginToViewContact: "தொடர்பு எண்ணை பார்க்க உள்நுழையவும்",
    saveListing: "பயிரை சேமிக்கவும்",
    sellTitle: "விளைபொருளை விற்பனைக்கு பட்டியலிடுங்கள்",
    sellSub: "உங்கள் அறுவடை செய்த விளைபொருட்களை ஆயிரக்கணக்கான வியாபாரிகளுக்கு விற்கவும்."
  },
  te: {
    // Telugu (తెలుగు)
    appName: "ఫార్మ్‌వైజ్ ఏఐ (FarmWise AI)",
    home: "హోమ్",
    marketplace: "వ్యవసాయ మార్కెట్",
    buyCrops: "పంటలు కొనండి",
    sellCrops: "పంటలు అమ్మండి",
    diagnose: "వ్యాధి నిర్ధారణ",
    community: "రైతు సమాచారం",
    history: "చరిత్ర",
    profile: "ప్రొఫైల్",
    login: "లాగిన్",
    register: "రిజిస్టర్",
    logout: "లాగ్ అవుట్",
    dashboard: "డ్యాష్‌బోర్డ్",
    myListings: "నా పంటలు",
    saved: "సేవ్ చేసినవి",
    notifications: "నోటిఫికేషన్లు",
    admin: "అడ్మిన్",
    about: "మా గురించి",
    contact: "సంప్రదించండి",
    save: "సేవ్",
    cancel: "రద్దు",
    submit: "సమర్పించు",
    search: "వెతకండి",
    filter: "ఫిల్టర్",
    loading: "లోడ్ అవుతోంది...",
    retry: "మళ్ళీ ప్రయత్నించండి",
    all: "అన్నీ",
    viewDetails: "వివరాలు చూడండి",
    back: "వెనుకకు",
    farmerDashboard: "రైతు డ్యాష్‌బోర్డ్",
    buyerDashboard: "కొనుగోలుదారు డ్యాష్‌బోర్డ్",
    postListing: "అమ్మకానికి పంటను జోడించండి",
    recentAnalyses: "ఇటీవలి విశ్లేషణలు",
    heroTitle: "ఫార్మ్‌వైజ్ ఏఐ",
    heroSubtitle: "ఏఐ పంట వ్యాధి నిర్ధారణ మరియు ప్రత్యక్ష రైతు మార్కెట్",
    heroDesc: "పంట వ్యాధులను తక్షణమే గుర్తించండి మరియు భారతదేశ వ్యాప్తంగా ఉన్న హోల్‌సేల్ వ్యాపారులతో నేరుగా కనెక్ట్ అవ్వండి.",
    ctaDiagnose: "పంటను పరీక్షించండి",
    ctaMarketplace: "మార్కెట్ చూడండి",
    marketTitle: "వ్యవసాయ ఉత్పత్తుల మార్కెట్ (Marketplace)",
    marketSub: "రైతులు మరియు హోల్‌సేల్ కొనుగోలుదారులకు ప్రత్యక్ష వేదిక. తాజా పంట, సరసమైన ధరలు, దళారులు లేరు.",
    searchPlaceholder: "పంట (ఉదా. వరి, మిరప, పత్తి), రకం లేదా జిల్లా ద్వారా వెతకండి...",
    pricePerQuintal: "క్వింటాల్‌కు ధర",
    availableQuantity: "లభ్యమయ్యే పరిమాణం",
    quintals: "క్వింటాళ్ళు",
    tonnes: "టన్నులు",
    contactSeller: "రైతును సంప్రదించండి",
    callSeller: "కాల్ చేయండి",
    whatsappSeller: "వాట్సాప్ చేయండి",
    loginToViewContact: "ఫోన్ నంబర్ చూడటానికి లాగిన్ అవ్వండి",
    saveListing: "పంటను సేవ్ చేయండి",
    sellTitle: "అమ్మకానికి పంటను నమోదు చేయండి",
    sellSub: "మీ పంటను భారతదేశంలోని వేలాది మంది వ్యాపారుల వద్దకు తీసుకెళ్లండి."
  },
  gu: {
    // Gujarati (ગુજરાતી)
    appName: "ફાર્મવાઇઝ એઆઈ (FarmWise AI)",
    home: "મુખ્યપૃષ્ઠ",
    marketplace: "કૃષિ બજાર / મંડી",
    buyCrops: "પાક ખરીદો",
    sellCrops: "પાક વેચો",
    diagnose: "રોગ નિદાન",
    community: "સમુદાય માહિતી",
    history: "ઇતિહાસ",
    profile: "પ્રોફાઇલ",
    login: "સાઇન ઇન",
    register: "નોંધણી કરો",
    logout: "લૉગ આઉટ",
    dashboard: "ડેશબોર્ડ",
    myListings: "મારા પાક",
    saved: "સાચવેલ",
    notifications: "સૂચનાઓ",
    admin: "એડમિન",
    about: "અમારા વિશે",
    contact: "સંપર્ક",
    save: "સાચવો",
    cancel: "રદ કરો",
    submit: "સબમિટ કરો",
    search: "શોધો",
    filter: "ફિલ્ટર",
    loading: "લોડ થઈ રહ્યું છે...",
    retry: "ફરી પ્રયાસ કરો",
    all: "બધા",
    viewDetails: "વિગતો જુઓ",
    back: "પાછળ",
    farmerDashboard: "ખેડૂત ડેશબોર્ડ",
    buyerDashboard: "વેપારી ડેશબોર્ડ",
    postListing: "વેચાણ માટે પાક ઉમેરો",
    recentAnalyses: "તાજેતરનું નિદાન",
    heroTitle: "ફાર્મવાઇઝ એઆઈ",
    heroSubtitle: "એઆઈ પાક રોગ નિદાન અને સીધું કૃષિ બજાર",
    heroDesc: "પાકના રોગોનું તુરંત નિદાન કરો અને દેશભરના જથ્થાબંધ ખરીદદારો સાથે સીધા સંપર્કમાં આવો.",
    ctaDiagnose: "પાકની તપાસ કરો",
    ctaMarketplace: "બજાર જુઓ",
    marketTitle: "કૃષિ ઉપજ બજાર (Marketplace)",
    marketSub: "ખેડૂતો અને જથ્થાબંધ ખરીદદારો સીધા સંપર્કમાં. તાજો પાક, પારદર્શક ભાવ, દલાલો વિના.",
    searchPlaceholder: "પાક (દા.ત. કપાસ, મગફળી, ઘઉં), જાત અથવા જિલ્લા દ્વારા શોધો...",
    pricePerQuintal: "પ્રતિ ક્વિન્ટલ",
    availableQuantity: "ઉપલબ્ધ જથ્થો",
    quintals: "ક્વિન્ટલ",
    tonnes: "ટન",
    contactSeller: "ખેડૂતનો સંપર્ક કરો",
    callSeller: "કૉલ કરો",
    whatsappSeller: "વોટ્સએપ કરો",
    loginToViewContact: "સંપર્ક નંબર જોવા માટે સાઇન ઇન કરો",
    saveListing: "પાક સાચવો",
    sellTitle: "વેચાણ માટે પાક નોંધાવો",
    sellSub: "તમારો પાક હજારો ચકાસાયેલા જથ્થાબંધ વેપારીઓ સમક્ષ રજૂ કરો."
  },
  kn: {
    // Kannada (ಕನ್ನಡ)
    appName: "ಫಾರ್ಮ್‌ವೈಸ್ ಎಐ (FarmWise AI)",
    home: "ಮುಖಪುಟ",
    marketplace: "ಕೃಷಿ ಮಾರುಕಟ್ಟೆ",
    buyCrops: "ಬೆಳೆ ಖರೀದಿ",
    sellCrops: "ಬೆಳೆ ಮಾರಾಟ",
    diagnose: "ರೋಗ ಪತ್ತೆ",
    community: "ರೈತ ಸಮುದಾಯ",
    history: "ಇತಿಹಾಸ",
    profile: "ಪ್ರೊಫೈಲ್",
    login: "ಸೈನ್ ಇನ್",
    register: "ನೋಂದಣಿ",
    logout: "ಲಾಗ್ ಔಟ್",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    myListings: "ನನ್ನ ಬೆಳೆಗಳು",
    saved: "ಉಳಿಸಲಾದವು",
    notifications: "ಸೂಚನೆಗಳು",
    admin: "ನಿರ್ವಾಹಕ",
    about: "ನಮ್ಮ ಬಗ್ಗೆ",
    contact: "ಸಂಪರ್ಕ",
    save: "ಉಳಿಸಿ",
    cancel: "ರದ್ದುಮಾಡಿ",
    submit: "ಸಲ್ಲಿಸಿ",
    search: "ಹುಡುಕಿ",
    filter: "ಫಿಲ್ಟರ್",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
    all: "ಎಲ್ಲಾ",
    viewDetails: "ವಿವರಗಳನ್ನು ನೋಡಿ",
    back: "ಹಿಂದಕ್ಕೆ",
    farmerDashboard: "ರೈತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    buyerDashboard: "ಖರೀದಿದಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    postListing: "ಮಾರಾಟಕ್ಕೆ ಬೆಳೆ ಸೇರಿಸಿ",
    recentAnalyses: "ಇತ್ತೀಚಿನ ವಿಶ್ಲೇಷಣೆಗಳು",
    heroTitle: "ಫಾರ್ಮ್‌ವೈಸ್ ಎಐ",
    heroSubtitle: "ಎಐ ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಮತ್ತು ನೇರ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ",
    heroDesc: "ಬೆಳೆ ರೋಗಗಳನ್ನು ತಕ್ಷಣ ಪತ್ತೆಹಚ್ಚಿ ಮತ್ತು ದೇಶದಾದ್ಯಂತದ ಸಗಟು ವ್ಯಾಪಾರಿಗಳೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕ ಸಾಧಿಸಿ.",
    ctaDiagnose: "ಬೆಳೆ ಪರೀಕ್ಷಿಸಿ",
    ctaMarketplace: "ಮಾರುಕಟ್ಟೆ ವೀಕ್ಷಿಸಿ",
    marketTitle: "ಕೃಷಿ ಉತ್ಪನ್ನ ಮಾರುಕಟ್ಟೆ (Marketplace)",
    marketSub: "ರೈತರು ಮತ್ತು ಸಗಟು ಖರೀದಿದಾರರಿಗೆ ನೇರ ವೇದಿಕೆ. ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ಉತ್ತಮ ಬೆಲೆ.",
    searchPlaceholder: "ಬೆಳೆ (ಉದಾ. ಭತ್ತ, ರಾಗಿ, ಮೆಕ್ಕೆಜೋಳ), ತಳಿ ಅಥವಾ ಜಿಲ್ಲೆಯ ಮೂಲಕ ಹುಡುಕಿ...",
    pricePerQuintal: "ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್‌ಗೆ",
    availableQuantity: "ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣ",
    quintals: "ಕ್ವಿಂಟಾಲ್",
    tonnes: "ಟನ್",
    contactSeller: "ಮಾರಾಟಗಾರರನ್ನು ಸಂಪರ್ಕಿಸಿ",
    callSeller: "ಕರೆ ಮಾಡಿ",
    whatsappSeller: "ವಾಟ್ಸಾಪ್ ಮಾಡಿ",
    loginToViewContact: "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ ನೋಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
    saveListing: "ಬೆಳೆ ಉಳಿಸಿ",
    sellTitle: "ಮಾರಾಟಕ್ಕಾಗಿ ಬೆಳೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಿ",
    sellSub: "ನಿಮ್ಮ ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಸಾವಿರಾರು ಖರೀದಿದಾರರಿಗೆ ತಲುಪಿಸಿ."
  },
  ml: {
    // Malayalam (മലയാളം)
    appName: "ഫാംവൈസ് എഐ (FarmWise AI)",
    home: "ഹോം",
    marketplace: "കാർഷിക ചന്ത",
    buyCrops: "വിളകൾ വാങ്ങുക",
    sellCrops: "വിളകൾ വിൽക്കുക",
    diagnose: "രോഗനിർണയം",
    community: "കർഷക കൂട്ടായ്മ",
    history: "ചരിത്രം",
    profile: "പ്രൊഫൈൽ",
    login: "സൈൻ ഇൻ",
    register: "രജിസ്റ്റർ ചെയ്യുക",
    logout: "ലോഗ് ഔട്ട്",
    dashboard: "ഡാഷ്‌ബോർഡ്",
    myListings: "എന്റെ വിളകൾ",
    saved: "സൂക്ഷിച്ചവ",
    notifications: "അറിയിപ്പുകൾ",
    admin: "അഡ്മിൻ",
    about: "ഞങ്ങളെക്കുറിച്ച്",
    contact: "ബന്ധപ്പെടുക",
    save: "സൂക്ഷിക്കുക",
    cancel: "റദ്ദാക്കുക",
    submit: "സമർപ്പിക്കുക",
    search: "തിരയുക",
    filter: "ഫിൽട്ടർ",
    loading: "ലോഡ് ചെയ്യുന്നു...",
    retry: "വീണ്ടും ശ്രമിക്കുക",
    all: "എല്ലാം",
    viewDetails: "വിശദാംശങ്ങൾ കാണുക",
    back: "പിന്നോട്ട്",
    farmerDashboard: "കർഷക ഡാഷ്‌ബോർഡ്",
    buyerDashboard: "വ്യാപാരി ഡാഷ്‌ബോർഡ്",
    postListing: "വിൽപ്പനയ്ക്കായി വിള ചേർക്കുക",
    recentAnalyses: "സമീപകാല പരിശോധനകൾ",
    heroTitle: "ഫാംവൈസ് എഐ",
    heroSubtitle: "എഐ വിള രോഗനിർണയവും നേരിട്ടുള്ള കാർഷിക വിപണിയും",
    heroDesc: "വിള രോഗങ്ങൾ തൽക്ഷണം കണ്ടെത്തുക, മൊത്തവ്യാപാരികളുമായി നേരിട്ട് ഇടപാട് നടത്തുക.",
    ctaDiagnose: "വിള പരിശോധിക്കുക",
    ctaMarketplace: "വിപണി കാണുക",
    marketTitle: "കാർഷിക ഉൽപ്പന്ന വിപണി (Marketplace)",
    marketSub: "കർഷകർക്കും മൊത്തവ്യാപാരികൾക്കും നേരിട്ടുള്ള ഇടനിലക്കാരില്ലാത്ത വിപണി.",
    searchPlaceholder: "വിള (ഉദാ. വാഴ, റബ്ബർ, കുരുമുളക്), ഇനം അല്ലെങ്കിൽ ജില്ല വഴി തിരയുക...",
    pricePerQuintal: "ക്വിന്റലിന്",
    availableQuantity: "ലഭ്യമായ അളവ്",
    quintals: "ക്വിന്റൽ",
    tonnes: "ടൺ",
    contactSeller: "കർഷകനെ ബന്ധപ്പെടുക",
    callSeller: "വിളിക്കുക",
    whatsappSeller: "വാട്‌സ്ആപ്പ് ചെയ്യുക",
    loginToViewContact: "നമ്പർ കാണാൻ സൈൻ ഇൻ ചെയ്യുക",
    saveListing: "വിള സേവ് ചെയ്യുക",
    sellTitle: "വിൽപ്പനയ്ക്കായി വിള പട്ടികപ്പെടുത്തുക",
    sellSub: "നിങ്ങളുടെ കാർഷിക വിളകൾ ആയിരക്കണക്കിന് വ്യാപാരികളിലേക്ക് എത്തിക്കൂ."
  },
  or: {
    // Odia (ଓଡ଼ିଆ)
    appName: "ଫାର୍ମୱାଇଜ୍ ଏଆଇ (FarmWise AI)",
    home: "ମୁଖ୍ୟ ପୃଷ୍ଠା",
    marketplace: "କୃଷି ବଜାର / ମଣ୍ଡି",
    buyCrops: "ଫସଲ କିଣନ୍ତୁ",
    sellCrops: "ଫସଲ ବିକ୍ରୟ କରନ୍ତୁ",
    diagnose: "ରୋଗ ଚିହ୍ନଟ",
    community: "କୃଷକ ସୂଚନା",
    history: "ଇତିହାସ",
    profile: "ପ୍ରୋଫାଇଲ୍",
    login: "ଲଗ୍ ଇନ୍",
    register: "ପଞ୍ଜୀକରଣ କରନ୍ତୁ",
    logout: "ଲଗ୍ ଆଉଟ୍",
    dashboard: "ଡ୍ୟାସବୋର୍ଡ",
    myListings: "ମୋର ଫସଲ",
    saved: "ସାଇତା ହୋଇଥିବା",
    notifications: "ବିଜ୍ଞପ୍ତି",
    admin: "ଆଡମିନ୍",
    about: "ଆମ ବିଷୟରେ",
    contact: "ଯୋଗାଯୋଗ",
    save: "ସାଇତନ୍ତୁ",
    cancel: "ବାତିଲ୍",
    submit: "ଦାଖଲ କରନ୍ତୁ",
    search: "ଖୋଜନ୍ତୁ",
    filter: "ଫିଲ୍ଟର୍",
    loading: "ଲୋଡ୍ ହେଉଛି...",
    retry: "ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ",
    all: "ସମସ୍ତ",
    viewDetails: "ବିବରଣୀ ଦେଖନ୍ତୁ",
    back: "ପଛକୁ",
    farmerDashboard: "କୃଷକ ଡ୍ୟାସବୋର୍ଡ",
    buyerDashboard: "ବ୍ୟବସାୟୀ ଡ୍ୟାସବୋର୍ଡ",
    postListing: "ବିକ୍ରୟ ପାଇଁ ଫସଲ ଯୋଡନ୍ତୁ",
    recentAnalyses: "ନିକଟତର ପରୀକ୍ଷା",
    heroTitle: "ଫାର୍ମୱାଇଜ୍ ଏଆଇ",
    heroSubtitle: "ଏଆଇ-ଆଧାରିତ ଫସଲ ରୋଗ ଚିହ୍ନଟ ଏବଂ ସିଧାସଳଖ କୃଷି ବଜାର",
    heroDesc: "ଫସଲ ରୋଗଗୁଡିକୁ ତୁରନ୍ତ ଚିହ୍ନଟ କରନ୍ତୁ ଏବଂ ଦେଶର ବଡ଼ ବ୍ୟବସାୟୀମାନଙ୍କ ସହିତ ସିଧାସଳଖ ଯୋଡି ହୁଅନ୍ତୁ।",
    ctaDiagnose: "ଫସଲ ପରୀକ୍ଷା କରନ୍ତୁ",
    ctaMarketplace: "ବଜାର ଦେଖନ୍ତୁ",
    marketTitle: "କୃଷି ଉତ୍ପାଦ ବଜାର (Marketplace)",
    marketSub: "କୃଷକ ଏବଂ ବ୍ୟବସାୟୀ ସିଧାସଳଖ ସମ୍ପର୍କରେ। ସତେଜ ଫସଲ, ଉପଯୁକ୍ତ ମୂଲ୍ୟ, ମଧ୍ୟସ୍ଥତାମୁକ୍ତ।",
    searchPlaceholder: "ଫସଲ (ଯଥା ଧାନ, ମାଣ୍ଡିଆ, ପନିପରିବା), କିସମ କିମ୍ବା ଜିଲ୍ଲା ଅନୁସାରେ ଖୋଜନ୍ତୁ...",
    pricePerQuintal: "ପ୍ରତି କ୍ୱିଣ୍ଟାଲ୍",
    availableQuantity: "ଉପଲବ୍ଧ ପରିମାଣ",
    quintals: "କ୍ୱିଣ୍ଟାଲ୍",
    tonnes: "ଟନ୍",
    contactSeller: "କୃଷକଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ",
    callSeller: "କଲ୍ କରନ୍ତୁ",
    whatsappSeller: "ହ୍ୱାଟ୍ସଆପ୍ କରନ୍ତୁ",
    loginToViewContact: "ନମ୍ବର ଦେଖିବା ପାଇଁ ଲଗ୍ ଇନ୍ କରନ୍ତୁ",
    saveListing: "ଫସଲ ସାଇତନ୍ତୁ",
    sellTitle: "ବିକ୍ରୟ ପାଇଁ ଫସଲ ତାଲିକାଭୁକ୍ତ କରନ୍ତୁ",
    sellSub: "ଆପଣଙ୍କ ଉତ୍ପାଦିତ ଫସଲକୁ ହଜାର ହଜାର ବ୍ୟବସାୟୀଙ୍କ ନିକଟରେ ପହଞ୍ଚାନ୍ତୁ।"
  }
};

function buildLocale(langCode, map) {
  // Deep clone English template
  const target = JSON.parse(JSON.stringify(en));

  // Override common keys
  if (map.appName) target.common.appName = map.appName;
  if (map.home) target.common.home = map.home;
  if (map.marketplace) target.common.marketplace = map.marketplace;
  if (map.buyCrops) target.common.buyCrops = map.buyCrops;
  if (map.sellCrops) target.common.sellCrops = map.sellCrops;
  if (map.diagnose) target.common.diagnose = map.diagnose;
  if (map.community) target.common.community = map.community;
  if (map.history) target.common.history = map.history;
  if (map.profile) target.common.profile = map.profile;
  if (map.login) target.common.login = map.login;
  if (map.register) target.common.register = map.register;
  if (map.logout) target.common.logout = map.logout;
  if (map.dashboard) target.common.dashboard = map.dashboard;
  if (map.myListings) target.common.myListings = map.myListings;
  if (map.saved) target.common.saved = map.saved;
  if (map.notifications) target.common.notifications = map.notifications;
  if (map.admin) target.common.admin = map.admin;
  if (map.about) target.common.about = map.about;
  if (map.contact) target.common.contact = map.contact;
  if (map.save) target.common.save = map.save;
  if (map.cancel) target.common.cancel = map.cancel;
  if (map.submit) target.common.submit = map.submit;
  if (map.search) target.common.search = map.search;
  if (map.filter) target.common.filter = map.filter;
  if (map.loading) target.common.loading = map.loading;
  if (map.retry) target.common.retry = map.retry;
  if (map.all) target.common.all = map.all;
  if (map.viewDetails) target.common.viewDetails = map.viewDetails;
  if (map.back) target.common.back = map.back;

  // Nav
  if (map.farmerDashboard) target.nav.farmerDashboard = map.farmerDashboard;
  if (map.buyerDashboard) target.nav.buyerDashboard = map.buyerDashboard;
  if (map.postListing) target.nav.postListing = map.postListing;
  if (map.recentAnalyses) target.nav.recentAnalyses = map.recentAnalyses;

  // Hero
  if (map.heroTitle) target.hero.title = map.heroTitle;
  if (map.heroSubtitle) target.hero.subtitle = map.heroSubtitle;
  if (map.heroDesc) target.hero.description = map.heroDesc;
  if (map.ctaDiagnose) target.hero.ctaDiagnose = map.ctaDiagnose;
  if (map.ctaMarketplace) target.hero.ctaMarketplace = map.ctaMarketplace;

  // Marketplace
  if (map.marketTitle) target.marketplace.title = map.marketTitle;
  if (map.marketSub) target.marketplace.subtitle = map.marketSub;
  if (map.searchPlaceholder) target.marketplace.searchPlaceholder = map.searchPlaceholder;
  if (map.pricePerQuintal) target.marketplace.pricePerQuintal = map.pricePerQuintal;
  if (map.availableQuantity) target.marketplace.availableQuantity = map.availableQuantity;
  if (map.quintals) target.marketplace.quintals = map.quintals;
  if (map.tonnes) target.marketplace.tonnes = map.tonnes;
  if (map.contactSeller) target.marketplace.contactSeller = map.contactSeller;
  if (map.callSeller) target.marketplace.callSeller = map.callSeller;
  if (map.whatsappSeller) target.marketplace.whatsappSeller = map.whatsappSeller;
  if (map.loginToViewContact) target.marketplace.loginToViewContact = map.loginToViewContact;
  if (map.saveListing) target.marketplace.saveListing = map.saveListing;

  // Sell
  if (map.sellTitle) target.sell.title = map.sellTitle;
  if (map.sellSub) target.sell.subtitle = map.sellSub;

  return target;
}

for (const [lang, map] of Object.entries(REGIONAL_TRANSLATIONS)) {
  const data = buildLocale(lang, map);
  fs.writeFileSync(path.join(localesDir, `${lang}.json`), JSON.stringify(data, null, 2), "utf8");
  console.log(`Generated locale dictionary: src/i18n/locales/${lang}.json`);
}

console.log("All 11 regional language locale dictionaries generated successfully.");
