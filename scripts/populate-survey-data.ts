import { prisma } from "../lib/db";

async function populateSurveyData() {
  console.log("=== POPULATING STRUCTURED SURVEY DATA FOR REVIEWS ===");

  const reviews = await prisma.review.findMany();
  console.log(`Found ${reviews.length} reviews.`);

  const sampleSurveys = [
    {
      fitRating: "TRUE_TO_SIZE",
      qualityRating: 5,
      colorAccuracy: "EXACT_MATCH",
      comfortRating: 5,
      valueRating: 5,
      sizePurchased: "M",
      occasionWorn: "Festive & Wedding Ceremonies",
      recommend: true,
    },
    {
      fitRating: "TRUE_TO_SIZE",
      qualityRating: 5,
      colorAccuracy: "EXACT_MATCH",
      comfortRating: 4,
      valueRating: 5,
      sizePurchased: "L",
      occasionWorn: "Cocktail & Evening Soirée",
      recommend: true,
    },
    {
      fitRating: "RUNS_SMALL",
      qualityRating: 4,
      colorAccuracy: "SLIGHT_VARIATION",
      comfortRating: 4,
      valueRating: 4,
      sizePurchased: "S",
      occasionWorn: "Everyday Casual Luxury",
      recommend: true,
    },
    {
      fitRating: "TRUE_TO_SIZE",
      qualityRating: 5,
      colorAccuracy: "EXACT_MATCH",
      comfortRating: 5,
      valueRating: 5,
      sizePurchased: "XL",
      occasionWorn: "Office & Executive Formal",
      recommend: true,
    },
  ];

  for (let i = 0; i < reviews.length; i++) {
    const rev = reviews[i];
    const survey = sampleSurveys[i % sampleSurveys.length];

    await prisma.review.update({
      where: { id: rev.id },
      data: {
        fitRating: rev.fitRating || survey.fitRating,
        qualityRating: rev.qualityRating || survey.qualityRating,
        colorAccuracy: rev.colorAccuracy || survey.colorAccuracy,
        comfortRating: rev.comfortRating || survey.comfortRating,
        valueRating: rev.valueRating || survey.valueRating,
        sizePurchased: rev.sizePurchased || survey.sizePurchased,
        occasionWorn: rev.occasionWorn || survey.occasionWorn,
        recommend: rev.recommend ?? survey.recommend,
      },
    });
  }

  console.log("✅ Successfully populated survey data across all reviews in database!");
}

populateSurveyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
