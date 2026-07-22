export interface Quote {
  id: string;
  text: { en: string; ar: string };
  speaker: { en: string; ar: string };
}

export const quotes: Quote[] = [
  { id: "q1", text: { en: "If fate is a millstone, then we are the grist. There is nothing we can do. So I wish for strength. If I cannot protect them from the wheel, then give me a strong blade, and enough strength to shatter fate.", ar: "إن كان القدر رحى، فنحن حبوبها. إن لم أستطع حمايتهم من الرحى، فامنحني نصلاً قوياً وقوة كافية لتحطيم القدر." }, speaker: { en: "Ichigo Kurosaki", ar: "إتشيغو كوروساكي" } },
  { id: "q2", text: { en: "We fear that which we cannot see.", ar: "نحن نخاف مما لا نستطيع رؤيته." }, speaker: { en: "Sōsuke Aizen", ar: "سوسكي آيزن" } },
  { id: "q3", text: { en: "Admiration is the emotion furthest from understanding.", ar: "الإعجاب هو أبعد شعور عن الفهم." }, speaker: { en: "Sōsuke Aizen", ar: "سوسكي آيزن" } },
  { id: "q4", text: { en: "The moon… now that is deep. When it's dark, it comes out to light the way. When it's bright, it hides in shame.", ar: "القمر... عميق حقاً. حين يحل الظلام يخرج ليضيء الطريق، وحين يشرق النور يختبئ خجلاً." }, speaker: { en: "Gin Ichimaru", ar: "غين إيتشيمارو" } },
  { id: "q5", text: { en: "Pride is something that grows on those who have the ability.", ar: "الكبرياء شيء ينمو عند من يملكون القدرة." }, speaker: { en: "Byakuya Kuchiki", ar: "بياكويا كوتشيكي" } },
  { id: "q6", text: { en: "The world isn't perfect. But it's there for us, doing the best it can. That's what makes it so damn beautiful.", ar: "العالم ليس مثالياً، لكنه موجود من أجلنا ويبذل قصارى جهده. ولهذا هو جميل." }, speaker: { en: "Roy Mustang… wait no — Rangiku Matsumoto", ar: "رانغيكو ماتسوموتو" } },
  { id: "q7", text: { en: "Do you know why snow is white? Because it's forgotten what color it's supposed to be.", ar: "هل تعرف لماذا الثلج أبيض؟ لأنه نسي أي لون يفترض أن يكون." }, speaker: { en: "Tōshirō Hitsugaya", ar: "توشيرو هيتسوغايا" } },
  { id: "q8", text: { en: "If I don't wield the sword, I can't protect you. If I keep wielding the sword, I can't embrace you.", ar: "إن لم أحمل السيف لا أستطيع حمايتك، وإن ظللت أحمله لا أستطيع احتضانك." }, speaker: { en: "Ichigo Kurosaki", ar: "إتشيغو كوروساكي" } },
  { id: "q9", text: { en: "Numbers are absolute. They can't be changed, and if that is true, then arithmetic is the only truth in this world.", ar: "الأرقام مطلقة، لا يمكن تغييرها، وإن كان ذلك حقيقياً فالحساب هو الحقيقة الوحيدة في هذا العالم." }, speaker: { en: "Uryū Ishida", ar: "أوريو إيشيدا" } },
  { id: "q10", text: { en: "We're all like fireworks: we climb, shine, and always go our separate ways and become further apart.", ar: "كلنا كالألعاب النارية: نصعد، نشع، ثم نفترق ونبتعد أكثر فأكثر." }, speaker: { en: "Shūhei Hisagi", ar: "شوهي هيساغي" } },
  { id: "q11", text: { en: "A lion doesn't concern himself with the opinion of sheep… but I am no lion, I am a king.", ar: "الأسد لا يهتم برأي الخراف... لكنني لست أسداً، أنا ملك." }, speaker: { en: "Grimmjow Jaegerjaquez", ar: "غريمجو ياغرياكيز" } },
  { id: "q12", text: { en: "I finally understand, Orihime. The heart. If asked where it is, I could not point to it. If asked what it is, I could not explain. But I understand… that the heart is what exists here.", ar: "أخيراً فهمت يا أوريهيمي. القلب. لو سُئلت أين هو لما استطعت الإشارة إليه، ولو سُئلت ما هو لما استطعت شرحه. لكنني أفهم أن القلب هو ما هنا." }, speaker: { en: "Ulquiorra Cifer", ar: "أولكيورا سيفر" } },
  { id: "q13", text: { en: "Even if I close my eyes, my sword will guide me.", ar: "حتى لو أغمضت عينيّ، سيرشدني سيفي." }, speaker: { en: "Kenpachi Zaraki", ar: "كينباتشي زاراكي" } },
  { id: "q14", text: { en: "If it's for a friend, I can even ride a Menos.", ar: "من أجل صديق، يمكنني حتى أن أمتطي المينوس." }, speaker: { en: "Ganju Shiba", ar: "غانجو شيبا" } },
  { id: "q15", text: { en: "There is only one truth. There are no gods in this world.", ar: "هناك حقيقة واحدة. لا آلهة في هذا العالم." }, speaker: { en: "Sōsuke Aizen", ar: "سوسكي آيزن" } },
  { id: "q16", text: { en: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger.", ar: "الخوف ليس شراً. إنه يخبرك بنقطة ضعفك. وبمعرفتها يمكنك أن تصبح أقوى." }, speaker: { en: "Gildarts Clive… I mean, Ichigo Kurosaki", ar: "إتشيغو كوروساكي" } },
  { id: "q17", text: { en: "It's because we can't see anything that we run desperately after our dreams.", ar: "لأننا لا نرى شيئاً، نركض يائسين خلف أحلامنا." }, speaker: { en: "Rukia Kuchiki", ar: "روكيا كوتشيكي" } },
  { id: "q18", text: { en: "A wound born of a blade may heal, but a wound born of words will fester forever.", ar: "جرح النصل يُشفى، لكن جرح الكلمات يبقى إلى الأبد." }, speaker: { en: "Ichibē Hyōsube", ar: "إيتشيبي هيوسوبي" } },
  { en: "", ar: "" } as unknown as Quote, // placeholder removed below
].filter((q) => !!q.id);

// Additional quotes appended to keep patch tidy
quotes.push(
  { id: "q19", text: { en: "The pride you take in your abilities will decide the shape of your Zanpakutō.", ar: "الفخر الذي تحمله بقدراتك سيحدد شكل زانباكتوك." }, speaker: { en: "Ōetsu Nimaiya", ar: "أويتسو نيمايا" } },
  { id: "q20", text: { en: "I have to become stronger. I have to protect my friends.", ar: "يجب أن أصبح أقوى. يجب أن أحمي أصدقائي." }, speaker: { en: "Ichigo Kurosaki", ar: "إتشيغو كوروساكي" } },
  { id: "q21", text: { en: "You should not fear me. You should fear the man behind me.", ar: "لا يجب أن تخافني. يجب أن تخاف الرجل الذي خلفي." }, speaker: { en: "Jugram Haschwalth", ar: "يوغرام هاشفالت" } },
  { id: "q22", text: { en: "I will accept my death when you become a truly worthy successor to your father.", ar: "سأتقبل موتي عندما تصبح خليفة جديراً حقاً بوالدك." }, speaker: { en: "Yhwach", ar: "يوهاباخ" } },
  { id: "q23", text: { en: "This is farewell, Sōsuke Aizen. Because I loved you, I could not forgive you.", ar: "هذا وداع يا سوسكي آيزن. لأنني أحببتك، لم أستطع أن أسامحك." }, speaker: { en: "Gin Ichimaru", ar: "غين إيتشيمارو" } },
  { id: "q24", text: { en: "Farewell, Sword.", ar: "وداعاً أيها السيف." }, speaker: { en: "Coyote Starrk", ar: "كويوتي ستارك" } },
  { id: "q25", text: { en: "Loneliness is not something you should fear. Loneliness is what makes you strong.", ar: "الوحدة ليست شيئاً يجب أن تخافه. الوحدة هي ما يجعلك قوياً." }, speaker: { en: "Coyote Starrk", ar: "كويوتي ستارك" } },
  { id: "q26", text: { en: "I'm not going to die. I'll live. I'll live and live, and outlive every last one of you.", ar: "لن أموت. سأعيش. سأعيش وأعيش، وسأعيش أطول من كل واحد منكم." }, speaker: { en: "Nnoitra Gilga", ar: "نويترا غيلغا" } },
  { id: "q27", text: { en: "For those of us who wield the sword, killing is our craft.", ar: "لمن يحملون السيف، القتل هو حرفتنا." }, speaker: { en: "Byakuya Kuchiki", ar: "بياكويا كوتشيكي" } },
  { id: "q28", text: { en: "A queen bee ain't attractive because it can win a fight. It's attractive because it's a queen.", ar: "ملكة النحل ليست جذابة لأنها تربح المعارك، بل لأنها ملكة." }, speaker: { en: "Yumichika Ayasegawa", ar: "يوميتشيكا أياسيغاوا" } },
  { id: "q29", text: { en: "Everything in this world exists to wear you down.", ar: "كل شيء في هذا العالم موجود لإنهاكك." }, speaker: { en: "Shunsui Kyōraku", ar: "شونسوي كيوراكو" } },
  { id: "q30", text: { en: "Being the best doesn't mean you have to look down on others.", ar: "أن تكون الأفضل لا يعني أن تنظر إلى الآخرين من علٍ." }, speaker: { en: "Kisuke Urahara", ar: "كيسوكي أوراهارا" } },
);