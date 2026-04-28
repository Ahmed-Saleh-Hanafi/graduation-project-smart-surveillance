using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class update_relations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Detections_Cameras_CameraId",
                table: "Detections");

            migrationBuilder.DropForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections");

            migrationBuilder.AddForeignKey(
                name: "FK_Detections_Cameras_CameraId",
                table: "Detections",
                column: "CameraId",
                principalTable: "Cameras",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Detections_Cameras_CameraId",
                table: "Detections");

            migrationBuilder.DropForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections");

            migrationBuilder.AddForeignKey(
                name: "FK_Detections_Cameras_CameraId",
                table: "Detections",
                column: "CameraId",
                principalTable: "Cameras",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id");
        }
    }
}
