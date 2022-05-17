-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nusnet_id" VARCHAR(40),
    "matric_no" VARCHAR(40),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "profile_pic_url" TEXT,
    "github_url" TEXT,
    "linkedin_url" TEXT,
    "personal_site_url" TEXT,
    "self_intro" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
