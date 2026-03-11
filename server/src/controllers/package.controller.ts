import { Request, Response } from "express";
import { PackageService } from "../services/package.service";
import { PACKAGE_TYPE } from "../enums/packageType.enum";

const packageService = new PackageService();

export const getAllPackages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const packages = await packageService.getAllPackages(type as PACKAGE_TYPE);
    res.json(packages);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching packages" });
  }
};

export const getPackageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const subPackage = await packageService.getPackageById(Number(id));
    if (!subPackage) {
      res.status(404).json({ message: "Package not found" });
      return;
    }
    res.json(subPackage);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching package" });
  }
};

export const createPackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const newPackage = await packageService.createPackage(req.body);
    res.status(201).json(newPackage);
  } catch (error: any) {
    res.status(500).json({ message: "Error creating package" });
  }
};

export const updatePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedPackage = await packageService.updatePackage(Number(id), req.body);
    if (!updatedPackage) {
      res.status(404).json({ message: "Package not found" });
      return;
    }
    res.json(updatedPackage);
  } catch (error: any) {
    res.status(500).json({ message: "Error updating package" });
  }
};

export const deletePackage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await packageService.deletePackage(Number(id));
    if (!deleted) {
      res.status(404).json({ message: "Package not found" });
      return;
    }
    res.json({ message: "Package deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Error deleting package" });
  }
};
