import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/services/connectdb";
import VisitRequest from "@/models/visitRequest";
import authUser from "@/actions/authUser";

// Update visit request (mark/unmark, change status, add notes)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { isMarked, status, adminNotes } = await req.json();

    const visitRequest = await VisitRequest.findById(id);
    if (!visitRequest) {
      return NextResponse.json({
        success: false,
        message: "Visit request not found",
      });
    }

    // Update fields if provided
    if (typeof isMarked === "boolean") {
      visitRequest.isMarked = isMarked;
    }
    if (status) {
      visitRequest.status = status;
    }
    if (adminNotes !== undefined) {
      visitRequest.adminNotes = adminNotes;
    }

    await visitRequest.save();

    return NextResponse.json({
      success: true,
      message: "Visit request updated successfully",
      data: visitRequest,
    });

  } catch (error) {
    console.error("Update visit request error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update visit request",
    });
  }
}

// Delete visit request
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await context.params;

    const user = await authUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      });
    }

    const visitRequest = await VisitRequest.findByIdAndDelete(id);
    if (!visitRequest) {
      return NextResponse.json({
        success: false,
        message: "Visit request not found",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Visit request deleted successfully",
    });

  } catch (error) {
    console.error("Delete visit request error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete visit request",
    });
  }
} 