using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UserCameraTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "name",
                table: "Detections",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Detections",
                newName: "Id");

            migrationBuilder.CreateTable(
                name: "UserCameras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CameraId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserCameras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserCameras_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserCameras_Cameras_CameraId",
                        column: x => x.CameraId,
                        principalTable: "Cameras",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserCameras_CameraId",
                table: "UserCameras",
                column: "CameraId");

            migrationBuilder.CreateIndex(
                name: "IX_UserCameras_UserId",
                table: "UserCameras",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserCameras");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Detections",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Detections",
                newName: "id");
        }
    }
}
