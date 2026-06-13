import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";
import { computeDedupHash } from "../src/server/services/dedup";

const db = new PrismaClient();

const SAMPLE_ARTICLES = [
  {
    pmid: "12345678",
    title: "Effects of mindfulness on anxiety: a systematic review",
    authors: "Smith J, Doe A, Johnson B",
    citation: "Smith J et al. Mindfulness and anxiety. J Psychol. 2023.",
    firstAuthor: "Smith J",
    journal: "Journal of Psychology",
    year: 2023,
    createDate: "2023-01-15",
    pmcid: "PMC1234567",
    nihmsId: "",
    doi: "10.1000/example.2023.001",
  },
  {
    pmid: "23456789",
    title: "Cognitive behavioral therapy for depression in adolescents",
    authors: "Brown C, Wilson D",
    citation: "Brown C, Wilson D. CBT for adolescent depression. Clin Psych Rev. 2022.",
    firstAuthor: "Brown C",
    journal: "Clinical Psychology Review",
    year: 2022,
    createDate: "2022-06-20",
    pmcid: "",
    nihmsId: "NIHMS987654",
    doi: "10.1000/example.2022.002",
  },
  {
    pmid: "34567890",
    title: "Exercise interventions for chronic pain management",
    authors: "Lee H, Park S, Kim J",
    citation: "Lee H et al. Exercise and chronic pain. Pain Med. 2021.",
    firstAuthor: "Lee H",
    journal: "Pain Medicine",
    year: 2021,
    createDate: "2021-03-10",
    pmcid: "PMC7654321",
    nihmsId: "",
    doi: "10.1000/example.2021.003",
  },
  {
    pmid: "45678901",
    title: "Nutritional supplements and immune function: meta-analysis",
    authors: "Garcia M, Martinez R",
    citation: "Garcia M, Martinez R. Supplements and immunity. Nutr Rev. 2020.",
    firstAuthor: "Garcia M",
    journal: "Nutrition Reviews",
    year: 2020,
    createDate: "2020-11-05",
    pmcid: "",
    nihmsId: "",
    doi: "10.1000/example.2020.004",
  },
  {
    pmid: "56789012",
    title: "Sleep quality and academic performance in university students",
    authors: "Taylor E, Anderson F, White G",
    citation: "Taylor E et al. Sleep and academic performance. Sleep Health. 2023.",
    firstAuthor: "Taylor E",
    journal: "Sleep Health",
    year: 2023,
    createDate: "2023-08-22",
    pmcid: "PMC1111111",
    nihmsId: "",
    doi: "10.1000/example.2023.005",
  },
  {
    pmid: "67890123",
    title: "Telemedicine adoption during the COVID-19 pandemic",
    authors: "Chen L, Wang Y",
    citation: "Chen L, Wang Y. Telemedicine during COVID-19. JAMA Netw Open. 2021.",
    firstAuthor: "Chen L",
    journal: "JAMA Network Open",
    year: 2021,
    createDate: "2021-09-14",
    pmcid: "",
    nihmsId: "",
    doi: "10.1000/example.2021.006",
  },
  {
    pmid: "78901234",
    title: "Machine learning in medical diagnosis: opportunities and challenges",
    authors: "Patel N, Singh K, Kumar A",
    citation: "Patel N et al. ML in medical diagnosis. Lancet Digital Health. 2022.",
    firstAuthor: "Patel N",
    journal: "The Lancet Digital Health",
    year: 2022,
    createDate: "2022-02-28",
    pmcid: "PMC2222222",
    nihmsId: "",
    doi: "10.1000/example.2022.007",
  },
  {
    pmid: "89012345",
    title: "Social determinants of health in rural communities",
    authors: "Williams T",
    citation: "Williams T. Social determinants in rural health. Am J Public Health. 2020.",
    firstAuthor: "Williams T",
    journal: "American Journal of Public Health",
    year: 2020,
    createDate: "2020-04-17",
    pmcid: "",
    nihmsId: "",
    doi: "",
  },
  {
    pmid: "90123456",
    title: "Pharmacogenomics in personalized medicine",
    authors: "O'Brien S, Murphy P, Kelly R",
    citation: "O'Brien S et al. Pharmacogenomics review. Pharmacogenomics J. 2023.",
    firstAuthor: "O'Brien S",
    journal: "The Pharmacogenomics Journal",
    year: 2023,
    createDate: "2023-05-30",
    pmcid: "PMC3333333",
    nihmsId: "",
    doi: "10.1000/example.2023.009",
  },
  {
    pmid: "01234567",
    title: "Climate change impacts on vector-borne diseases",
    authors: "Nguyen V, Tran H",
    citation: "Nguyen V, Tran H. Climate and vector diseases. Lancet Planet Health. 2022.",
    firstAuthor: "Nguyen V",
    journal: "The Lancet Planetary Health",
    year: 2022,
    createDate: "2022-12-01",
    pmcid: "",
    nihmsId: "",
    doi: "10.1000/example.2022.010",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await db.user.upsert({
    where: { email: "owner@articledesk.dev" },
    update: { passwordHash },
    create: {
      name: "Project Owner",
      email: "owner@articledesk.dev",
      passwordHash,
    },
  });

  const reviewer = await db.user.upsert({
    where: { email: "reviewer@articledesk.dev" },
    update: { passwordHash },
    create: {
      name: "Reviewer User",
      email: "reviewer@articledesk.dev",
      passwordHash,
    },
  });

  const org = await db.organization.upsert({
    where: { id: "seed-org-1" },
    update: { name: "Research Lab Alpha" },
    create: {
      id: "seed-org-1",
      name: "Research Lab Alpha",
    },
  });

  await db.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: owner.id },
    },
    update: { role: "OWNER" },
    create: {
      organizationId: org.id,
      userId: owner.id,
      role: "OWNER",
    },
  });

  await db.organizationMember.upsert({
    where: {
      organizationId_userId: { organizationId: org.id, userId: reviewer.id },
    },
    update: { role: "MEMBER" },
    create: {
      organizationId: org.id,
      userId: reviewer.id,
      role: "MEMBER",
    },
  });

  const project1 = await db.project.upsert({
    where: { id: "seed-project-1" },
    update: { name: "Mindfulness SLR 2024" },
    create: {
      id: "seed-project-1",
      name: "Mindfulness SLR 2024",
      organizationId: org.id,
    },
  });

  const project2 = await db.project.upsert({
    where: { id: "seed-project-2" },
    update: { name: "Digital Health Interventions" },
    create: {
      id: "seed-project-2",
      name: "Digital Health Interventions",
      organizationId: org.id,
    },
  });

  for (const project of [project1, project2]) {
    await db.projectMember.upsert({
      where: {
        projectId_userId: { projectId: project.id, userId: owner.id },
      },
      update: { role: "OWNER" },
      create: {
        projectId: project.id,
        userId: owner.id,
        role: "OWNER",
      },
    });

    await db.projectMember.upsert({
      where: {
        projectId_userId: { projectId: project.id, userId: reviewer.id },
      },
      update: { role: "REVIEWER" },
      create: {
        projectId: project.id,
        userId: reviewer.id,
        role: "REVIEWER",
      },
    });
  }

  // Clear existing seed articles for idempotent re-runs
  await db.articleReview.deleteMany({
    where: { article: { projectId: project1.id } },
  });
  await db.article.deleteMany({ where: { projectId: project1.id } });

  for (const article of SAMPLE_ARTICLES) {
    const created = await db.article.create({
      data: {
        projectId: project1.id,
        pmid: article.pmid,
        title: article.title,
        authors: article.authors,
        citation: article.citation,
        firstAuthor: article.firstAuthor,
        journal: article.journal,
        year: article.year,
        createDate: article.createDate,
        pmcid: article.pmcid || null,
        nihmsId: article.nihmsId || null,
        doi: article.doi || null,
        dedupHash: computeDedupHash(article.pmid, article.doi),
      },
    });

    for (const userId of [owner.id, reviewer.id]) {
      await db.articleReview.create({
        data: {
          articleId: created.id,
          reviewerId: userId,
          status: "PENDING",
        },
      });
    }
  }

  // Set a few sample reviews for the owner
  const articles = await db.article.findMany({
    where: { projectId: project1.id },
    take: 3,
  });

  const statuses = ["INCLUDED", "EXCLUDED", "MAYBE"] as const;
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]!;
    await db.articleReview.update({
      where: {
        articleId_reviewerId: {
          articleId: article.id,
          reviewerId: owner.id,
        },
      },
      data: {
        status: statuses[i]!,
        note: `Sample review note for article ${i + 1}`,
        confidence: "MEDIUM",
      },
    });
  }

  console.log("Seed completed:");
  console.log("  Owner:    owner@articledesk.dev / password123");
  console.log("  Reviewer: reviewer@articledesk.dev / password123");
  console.log(`  Org:      ${org.name} (${org.id})`);
  console.log(`  Projects: ${project1.name}, ${project2.name}`);
  console.log(`  Articles: ${SAMPLE_ARTICLES.length} in ${project1.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
