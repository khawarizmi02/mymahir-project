import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler.ts";
import { s3Service } from "../service/s3.service.ts";

// POST /api/v1/properties → createProperty()
// GET /api/v1/properties → getProperties (with filters)
// GET /api/v1/properties/:id → getPropertyById()
// PUT /api/v1/properties/:id → updateProperty()
// DELETE /api/v1/properties/:id → deleteProperty()
// GET /api/v1/properties/vacant → getVacantProperties() // for tenants

const CreateProperty = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true });
});

const GetProperties = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true });
});

const GetOneProperty = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true });
});

const UpdateProperty = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true });
});

const DeleteProperty = asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true });
});

const GetVacantProperties = asyncHandler(
  async (req: Request, res: Response) => {
    res.json({ success: true });
  }
);

const PresignedImageUrl = asyncHandler(async (req: Request, res: Response) => {
  const { filename, contentType } = req.query as {
    filename: string;
    contentType: string;
  };

  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType required" });
  }

  const { presignedUrl, publicUrl } = await s3Service.generatePresignedUrl(
    filename,
    contentType,
    `properties/${req.params.id}`
  );

  res.json({ presignedUrl, url: publicUrl });
});

const PropertyImage = asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;
  // validate user is landlord of this property...
  // then save to PropertyImage table
  // const image = await prisma.propertyImage.create({ data: { propertyId: +req.params.id, url } });
  res.json({ success: true });
});

export {
  PresignedImageUrl,
  PropertyImage,
  CreateProperty,
  GetProperties,
  GetOneProperty,
  GetVacantProperties,
  UpdateProperty,
  DeleteProperty,
};
