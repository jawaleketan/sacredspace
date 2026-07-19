import { db } from "../src/server/db";
import { deities, contents } from "../src/server/db/schema";
import { eq } from "drizzle-orm";

const seedDeities: Array<typeof deities.$inferInsert> = [
  {
    name: "Ganesha", slug: "ganesha",
    description: "The remover of obstacles, lord of beginnings, and patron of arts and sciences. Invoked before any new undertaking.",
    imageUrl: "",
  },
  {
    name: "Shiva", slug: "shiva",
    description: "The auspicious one, destroyer of evil, lord of meditation, arts, and dance. The supreme being in Shaivism.",
    imageUrl: "",
  },
  {
    name: "Vishnu", slug: "vishnu",
    description: "The preserver and protector of the universe, maintainer of dharma through his ten avatars.",
    imageUrl: "",
  },
  {
    name: "Durga", slug: "durga",
    description: "The invincible divine mother, warrior goddess who destroys evil forces and restores balance.",
    imageUrl: "",
  },
  {
    name: "Lakshmi", slug: "lakshmi",
    description: "The goddess of prosperity, wealth, fortune, and abundance. Consort of Vishnu.",
    imageUrl: "",
  },
  {
    name: "Saraswati", slug: "saraswati",
    description: "The goddess of knowledge, music, arts, wisdom, and learning. Flowing like a river in creative expression.",
    imageUrl: "",
  },
  {
    name: "Hanuman", slug: "hanuman",
    description: "The embodiment of devotion, strength, and selfless service. The mighty vanara who served Rama.",
    imageUrl: "",
  },
  {
    name: "Krishna", slug: "krishna",
    description: "The divine cowherd, supreme personality of Godhead, and teacher of the Bhagavad Gita.",
    imageUrl: "",
  },
];

interface ContentSeed {
  deitySlug: string;
  type: "mantra" | "stotra";
  title: string;
  slug: string;
  body: string;
  transliteration: string;
  translation: string;
  description: string;
}

const seedContents: ContentSeed[] = [
  {
    deitySlug: "ganesha", type: "mantra",
    title: "Ganesha Gayatri", slug: "ganesha-gayatri",
    body: "ॐ एकदन्ताय विद्महे\nवक्रतुण्डाय धीमहि\nतन्नो दन्ती प्रचोदयात्॥",
    transliteration: "Om ekadantāya vidmahe\nvakratuṇḍāya dhīmahi\ntanno dantī pracodayāt॥",
    translation: "Om. We meditate upon the single-tusked one. May that tusked one (Ganesha) illuminate our intellect.",
    description: "A powerful Gayatri mantra invoking Lord Ganesha for wisdom and removal of obstacles.",
  },
  {
    deitySlug: "ganesha", type: "stotra",
    title: "Ganesha Stotram", slug: "ganesha-stotram",
    body: "नमस्ते गणपतये नमस्ते\nत्वमेव प्रत्यक्षं ब्रह्मासि\nत्वमेव प्रत्यक्षं ब्रह्म वदिष्यामि",
    transliteration: "Namaste gaṇapataye namaste\ntvameva pratyakṣaṁ brahmāsi\ntvameva pratyakṣaṁ brahma vadiṣyāmi",
    translation: "Salutations to you, Lord of the Ganas. You alone are the manifest Brahman. I declare you as the manifest Brahman.",
    description: "A devotional hymn praising Lord Ganesha as the manifest Brahman.",
  },
  {
    deitySlug: "shiva", type: "mantra",
    title: "Maha Mrityunjaya Mantra", slug: "maha-mrityunjaya",
    body: "ॐ त्र्यम्बकं यजामहे\nसुगन्धिं पुष्टिवर्धनम्\nउर्वारुकमिव बन्धनान्\nमृत्योर्मुक्षीय माऽमृतात्॥",
    transliteration: "Om tryambakaṁ yajāmahe\nsugandhiṁ puṣṭivardhanam\nurvārukamiva bandhanān\nmṛtyormukṣīya māmṛtāt॥",
    translation: "Om. We worship the three-eyed one (Shiva) who is fragrant and nourishes all beings. May he liberate us from death, as a cucumber is severed from its vine, and grant us immortality.",
    description: "The great death-conquering mantra, one of the most powerful Vedic chants for healing and protection.",
  },
  {
    deitySlug: "shiva", type: "stotra",
    title: "Shiva Tandava Stotram", slug: "shiva-tandava-stotram",
    body: "जटा टवी गलज्जल प्रवाह पावितस्थले\nगलेऽवलम्ब्य लम्बितां भुजंग तुंग मालिकाम्\nडमड्डमड्डमड्डमन्निनाद वड्डमर्वयं\nचकार चण्डताण्डवं तनोतु नः शिवः शिवम्",
    transliteration: "Jaṭā ṭavī galajjala pravāha pāvitastale\ngale'valambya lambitāṁ bhujaṅga tuṅga mālikām\nḍamaḍḍamaḍḍamaḍḍamannināda vaḍḍamarvayaṁ\ncakāra caṇḍatāṇḍavaṁ tanotu naḥ śivaḥ śivam",
    translation: "From his matted hair, flowing streams of water purify the earth. Around his neck hangs a high garland of serpents. The sound of damaru drums echoes everywhere as he performs the fierce cosmic dance. May Lord Shiva grant us auspiciousness.",
    description: "A powerful hymn describing the cosmic dance of Lord Shiva.",
  },
  {
    deitySlug: "shiva", type: "stotra",
    title: "Lingashtakam", slug: "lingashtakam",
    body: "ब्रह्ममुरारी सुरार्चित लिङ्गं\nनिर्मल भासित शोभित लिङ्गम्\nजन्मज दुःख विनाशक लिङ्गं\nतत् प्रणमामि सदा शिव लिङ्गम्",
    transliteration: "Brahmamurārī surārcita liṅgaṁ\nnirmala bhāsita śobhita liṅgam\njanmaja duḥkha vināśaka liṅgaṁ\ntat praṇamāmi sadā śiva liṅgam",
    translation: "The linga worshipped by Brahma, Vishnu, and the gods. The linga shining with pure radiance. The linga that destroys the sorrows of birth and death. I bow always to that Shiva linga.",
    description: "Eight verses in praise of the Shiva Linga, the symbolic form of Lord Shiva.",
  },
  {
    deitySlug: "vishnu", type: "mantra",
    title: "Vishnu Gayatri", slug: "vishnu-gayatri",
    body: "ॐ नारायणाय विद्महे\nवासुदेवाय धीमहि\nतन्नो विष्णुः प्रचोदयात्॥",
    transliteration: "Om nārāyaṇāya vidmahe\nvāsudevāya dhīmahi\ntanno viṣṇuḥ pracodayāt॥",
    translation: "Om. We meditate upon Narayana (Vishnu). May Vasudeva (Vishnu) illuminate our intellect.",
    description: "Gayatri mantra dedicated to Lord Vishnu, the preserver of the universe.",
  },
  {
    deitySlug: "vishnu", type: "stotra",
    title: "Vishnu Sahasranama", slug: "vishnu-sahasranama",
    body: "शुक्लाम्बरधरं विष्णुं शशिवर्णं चतुर्भुजम्\nप्रसन्नवदनं ध्यायेत् सर्वविघ्नोपशान्तये",
    transliteration: "Śuklāmbaradharaṁ viṣṇuṁ śaśivarṇaṁ caturbhujam\nprasannavadanaṁ dhyāyet sarvavighnopaśāntaye",
    translation: "One should meditate on Vishnu, clad in white garments, with a moon-like complexion and four arms, with a pleasant countenance, for the pacification of all obstacles.",
    description: "The thousand names of Vishnu — one of the most sacred hymns in Hinduism.",
  },
  {
    deitySlug: "durga", type: "mantra",
    title: "Durga Gayatri", slug: "durga-gayatri",
    body: "ॐ कात्यायनाय विद्महे\nकन्याकुमारि धीमहि\nतन्नो दुर्गिः प्रचोदयात्॥",
    transliteration: "Om kātyāyanāya vidmahe\nkanyakumāri dhīmahi\ntanno durgiḥ pracodayāt॥",
    translation: "Om. We meditate upon Katyayani (Durga). May the virgin goddess Durga illuminate our intellect.",
    description: "Gayatri mantra invoking Goddess Durga for strength, courage, and divine protection.",
  },
  {
    deitySlug: "durga", type: "stotra",
    title: "Durga Chalisa", slug: "durga-chalisa",
    body: "नमो नमो दुर्गे सुख करनी\nनमो नमो अम्बे दुःख हरनी\nनिरंकार है ज्योति तुम्हारी\nतिहूँ लोक फैली उजियारी",
    transliteration: "Namo namo durge sukha karanī\nnamo namo ambe duḥkha haranī\nniraṅkāra hai jyoti tumhārī\ntihū~ loka phailī ujiyārī",
    translation: "Salutations to you, O Durga, bestower of happiness. Salutations to you, O Mother, remover of sorrow. Your light is formless and shines across all three worlds.",
    description: "Forty verses of praise to Goddess Durga, chanted for protection and blessings.",
  },
  {
    deitySlug: "lakshmi", type: "mantra",
    title: "Lakshmi Gayatri", slug: "lakshmi-gayatri",
    body: "ॐ महालक्ष्म्यै विद्महे\nविष्णुप्रियायै धीमहि\nतन्नो लक्ष्मीः प्रचोदयात्॥",
    transliteration: "Om mahālakṣmyai vidmahe\nviṣṇupriyāyai dhīmahi\ntanno lakṣmīḥ pracodayāt॥",
    translation: "Om. We meditate upon the great Lakshmi. May the beloved of Vishnu illuminate our intellect.",
    description: "Gayatri mantra invoking Goddess Lakshmi for prosperity and abundance.",
  },
  {
    deitySlug: "lakshmi", type: "stotra",
    title: "Lakshmi Stotram", slug: "lakshmi-stotram",
    body: "नमस्तेऽस्तु महामाये श्रीपीठे सुरपूजिते\nशङ्खचक्रगदाहस्ते महालक्ष्मि नमोऽस्तु ते",
    transliteration: "Namaste'stu mahāmāye śrīpīṭhe surapūjite\nśaṅkhacakragadāhaste mahālakṣmi namo'stu te",
    translation: "Salutations to you, O great Maya, seated on the lotus, worshipped by the gods. O Mahalakshmi, holding conch, discus, and mace, I bow to you.",
    description: "A devotional hymn praising Goddess Lakshmi, bestower of wealth and fortune.",
  },
  {
    deitySlug: "saraswati", type: "mantra",
    title: "Saraswati Gayatri", slug: "saraswati-gayatri",
    body: "ॐ सरस्वत्यै विद्महे\nब्रह्मपुत्र्यै धीमहि\nतन्नो सरस्वती प्रचोदयात्॥",
    transliteration: "Om sarasvatyai vidmahe\nbrahmaputryai dhīmahi\ntanno sarasvatī pracodayāt॥",
    translation: "Om. We meditate upon Saraswati, the daughter of Brahma. May Saraswati illuminate our intellect.",
    description: "Gayatri mantra invoking Goddess Saraswati for wisdom, knowledge, and eloquence.",
  },
  {
    deitySlug: "saraswati", type: "stotra",
    title: "Saraswati Stotram", slug: "saraswati-stotram",
    body: "या कुन्देन्दुतुषारहारधवला या शुभ्रवस्त्रावृता\nया वीणावरदण्डमण्डितकरा या श्वेतपद्मासना\nया ब्रह्माच्युत शंकरप्रभृतिभिर्देवैः सदा वन्दिता\nसा मां पातु सरस्वति भगवती निःशेषजाड्यापहा",
    transliteration: "Yā kundendutuṣārahāradhavalā yā śubhravastrāvṛtā\nyā vīṇāvaradaṇḍamaṇḍitakarā yā śvetapadmāsanā\nyā brahmācyuta śaṅkaraprabhṛtibhirdevaiḥ sadā vanditā\nsā māṁ pātu sarasvati bhagavatī niḥśeṣajāḍyāpahā",
    translation: "She who is white as the jasmine, the moon, and the snow, clad in white garments. She whose hands are adorned with the veena, seated on a white lotus. She who is ever worshipped by Brahma, Vishnu, Shiva, and all gods. May that goddess Saraswati protect me, removing all ignorance.",
    description: "A beautiful hymn describing Goddess Saraswati seated on a white lotus, holding a veena.",
  },
  {
    deitySlug: "hanuman", type: "mantra",
    title: "Hanuman Gayatri", slug: "hanuman-gayatri",
    body: "ॐ आञ्जनेयाय विद्महे\nवायुपुत्राय धीमहि\nतन्नो हनुमत् प्रचोदयात्॥",
    transliteration: "Om āñjaneyāya vidmahe\nvāyuputrāya dhīmahi\ntanno hanumat pracodayāt॥",
    translation: "Om. We meditate upon the son of Anjana (Hanuman). May the son of Vayu (Hanuman) illuminate our intellect.",
    description: "Gayatri mantra dedicated to Lord Hanuman for strength, devotion, and courage.",
  },
  {
    deitySlug: "hanuman", type: "stotra",
    title: "Hanuman Chalisa", slug: "hanuman-chalisa",
    body: "श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि\nबर्णउं रघुबर विमल जसु जो दायकु फल चारि\n\nबुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार\nबल बुधि बिद्या देहु मोहि, हरहु कलेस बिकार",
    transliteration: "Śrīguru carana sarōja raja nija manu mukuru sudhāri\nbarṇaū raghubara vimala jasu jō dāyaku phala cāri\n\nbuddhihīna tanu jānike, sumirau pavana-kumāra\nbala budhi vidyā dehu mōhi, harahu kalēsa bikāra",
    translation: "Cleaning the mirror of my mind with the dust of my guru's lotus feet, I describe the pure glory of Lord Rama, which bestows the four fruits of life. Knowing myself to be devoid of intellect, I remember the son of the wind god. Grant me strength, wisdom, and knowledge, and remove all my afflictions.",
    description: "Forty verses of devotion to Lord Hanuman, one of the most widely chanted hymns in India.",
  },
  {
    deitySlug: "krishna", type: "mantra",
    title: "Krishna Gayatri", slug: "krishna-gayatri",
    body: "ॐ देवकीनन्दनाय विद्महे\nवासुदेवाय धीमहि\nतन्नो कृष्णः प्रचोदयात्॥",
    transliteration: "Om devakīnandanāya vidmahe\nvāsudevāya dhīmahi\ntanno kṛṣṇaḥ pracodayāt॥",
    translation: "Om. We meditate upon the son of Devaki (Krishna). May Vasudeva (Krishna) illuminate our intellect.",
    description: "Gayatri mantra invoking Lord Krishna, the divine cowherd and teacher of the Bhagavad Gita.",
  },
  {
    deitySlug: "krishna", type: "stotra",
    title: "Krishna Ashtakam", slug: "krishna-ashtakam",
    body: "वसुदेवसुतं देवं कंसचाणूरमर्दनम्\nदेवकीपरमानन्दं कृष्णं वन्दे जगद्गुरुम्\n\nअतसीपुष्पसङ्काशं हारनूपुरशोभितम्\nरत्नकङ्कणकेयूरं कृष्णं वन्दे जगद्गुरुम्",
    transliteration: "Vasudevasutaṁ devaṁ kaṁsacāṇūramardanam\ndevakīparamānandaṁ kṛṣṇaṁ vande jagadgurum\n\natasīpuṣpasaṅkāśaṁ hāranūpuraśobhitam\nratnakaṅkaṇakeyūraṁ kṛṣṇaṁ vande jagadgurum",
    translation: "I bow to Krishna, the son of Vasudeva, the divine one who destroyed Kamsa and Chanura, the supreme joy of Devaki, the teacher of the world. I bow to Krishna, who shines like the flax flower, adorned with garlands and anklets, wearing jeweled bracelets and armlets, the teacher of the world.",
    description: "Eight verses in praise of Lord Krishna, celebrating his divine form and pastimes.",
  },
];

async function seed() {
  console.log("Seeding database...");

  for (const deity of seedDeities) {
    const existing = await db.select().from(deities).where(eq(deities.slug, deity.slug!)).get();
    if (existing) {
      console.log(`  Skipped deity: ${deity.name} (exists)`);
    } else {
      const result = await db.insert(deities).values(deity).returning().get();
      console.log(`  Added deity: ${result.name}`);
    }
  }

  const allDeities = await db.select().from(deities).all();
  const slugToId: Record<string, number> = {};
  for (const d of allDeities) {
    slugToId[d.slug] = d.id;
  }

  for (const content of seedContents) {
    const deityId = slugToId[content.deitySlug];
    if (!deityId) {
      console.log(`  Skipped content: ${content.title} (deity not found)`);
      continue;
    }
    const existing = await db.select().from(contents).where(eq(contents.slug, content.slug)).get();
    if (existing) {
      await db.update(contents)
        .set({
          transliteration: content.transliteration,
          translation: content.translation,
          body: content.body,
          description: content.description,
        })
        .where(eq(contents.slug, content.slug))
        .run();
      console.log(`  Updated content: ${content.title}`);
    } else {
      await db.insert(contents)
        .values({
          deityId,
          type: content.type,
          title: content.title,
          slug: content.slug,
          body: content.body,
          transliteration: content.transliteration,
          translation: content.translation,
          description: content.description,
        })
        .run();
      console.log(`  Added content: ${content.title}`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
