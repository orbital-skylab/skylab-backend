import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const checkMatricNoExists = async (matricNo: string) => {
  try {
    const student = await prisma.student.findUnique({
      where: { matricNo: matricNo },
    });
    return student ? true : false;
  } catch (e) {
    return false;
  }
};

export const checkNusnetIdExists = async (nusnetId: string) => {
  try {
    const student = await prisma.student.findUnique({
      where: { nusnetId: nusnetId },
    });
    return student ? true : false;
  } catch (e) {
    return false;
  }
};

export const checkStudentIdExists = async (studentId: number) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    return student ? true : false;
  } catch (e) {
    return false;
  }
};
