# S3 IMAGE UPLOAD & DELETE GUIDE  
**Rental MVP – Property Images (AWS S3 via Presigned URL)**

This guide covers the **complete flow** for uploading property images directly to S3 and deleting them later.  
All requests require a valid JWT (`Authorization: Bearer <token>`).

---

### Base URL & Environment Variables (Insomnia / Postman)

```json
{
  "base_url": "http://localhost:3000",
  "token":   "paste-your-jwt-here"
}
```

---

### 1. Generate Presigned URL (GET)

**Endpoint**  
```
GET {{base_url}}/api/v1/properties/:propertyId/images/presign
```

**Query Parameters** (required)  
| Param        | Example                | Description                     |
|--------------|------------------------|---------------------------------|
| `filename`   | `front-view.jpg`       | Original filename (with extension) |
| `contentType`| `image/jpeg` or `image/png` | MIME type of the file        |

**Request Example (Insomnia / cURL)**

```http
GET {{base_url}}/api/v1/properties/5/images/presign?filename=living-room.jpg&contentType=image/jpeg
Authorization: Bearer {{token}}
```

**Success Response (200)**

```json
{
  "presignedUrl": "https://mymahir-rentals-2025.s3.ap-southeast-1.amazonaws.com/properties/5/abc123-living-room.jpg?X-Amz-Signature=...",
  "url": "https://mymahir-rentals-2025.s3.ap-southeast-1.amazonaws.com/properties/5/abc123-living-room.jpg"
}
```

> Copy the full `presignedUrl` value – you’ll use it in the next step.

---

### 2. Upload Image Directly to S3 (PUT)

Create a **raw request** (not JSON) in Insomnia/Postman:

```http
PUT <paste-the-presignedUrl-exactly-here>
Content-Type: image/jpeg   (or image/png – must match the contentType you used above)
```

**Body → Binary File**  
→ Click **Body** → **Binary File** → select your photo from disk → **Send**

**Success** = `200 OK` (body is usually empty)  
Your image is now live in S3 and publicly viewable at the `url` from step 1.

---

### 3. Save Image URL in Database (POST)

```http
POST {{base_url}}/api/v1/properties/5/images
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "url": "https://mymahir-rentals-2025.s3.ap-southeast-1.amazonaws.com/properties/5/abc123-living-room.jpg"
}
```

**Response (201)**

```json
{
  "id": 42,
  "propertyId": 5,
  "url": "https://mymahir-rentals-2025.s3.ap-southeast-1.amazonaws.com/properties/5/abc123-living-room.jpg",
  "createdAt": "2025-11-24T10:00:00.000Z"
}
```

The image now appears when you fetch the property (`GET /api/v1/properties/5`).

---

### 4. Delete a Property Image (DELETE)

**Endpoint**  
```
DELETE {{base_url}}/api/v1/properties/:propertyId/images/:imageId
```

**Request Example**

```http
DELETE {{base_url}}/api/v1/properties/5/images/42
Authorization: Bearer {{token}}
```

**Success Response (200)**

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

What happens under the hood:  
- The object is permanently deleted from S3  
- The `PropertyImage` record is removed from the database  
- All in a single transaction (safe & atomic)

---

### Quick cURL Summary (for scripting)

```bash
# 1. Get presigned URL
curl -G "{{base_url}}/api/v1/properties/5/images/presign" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "filename=balcony.jpg" \
  --data-urlencode "contentType=image/jpeg"

# 2. Upload file
curl -X PUT "$PRESIGNED_URL" \
  --upload-file ./balcony.jpg \
  -H "Content-Type: image/jpeg"

# 3. Save URL
curl -X POST "{{base_url}}/api/v1/properties/5/images" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://mymahir-rentals-2025.s3.ap-southeast-1.amazonaws.com/properties/5/...balcony.jpg"}'

# 4. Delete image
curl -X DELETE "{{base_url}}/api/v1/properties/5/images/42" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Common Errors & Fixes

| Error                     | Cause                                    | Fix                                      |
|---------------------------|------------------------------------------|------------------------------------------|
| `403 SignatureDoesNotMatch` | Wrong `Content-Type` header or modified URL | Copy presigned URL exactly; match `Content-Type` |
| `400 Invalid content type` | Backend rejected MIME type               | Use only `image/jpeg` or `image/png`     |
| `404 Image not found`     | Wrong `imageId`                          | Check the ID returned when saving the image |
| `403 Forbidden`           | Missing/invalid token                    | Re-login and paste fresh JWT             |

---

**You’re done!**  
With these four requests you can fully manage property images end-to-end using S3 presigned URLs.