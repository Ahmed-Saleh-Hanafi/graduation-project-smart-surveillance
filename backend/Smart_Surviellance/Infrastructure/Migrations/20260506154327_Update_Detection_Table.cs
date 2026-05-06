using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Update_Detection_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Detections",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Detections",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "Detections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Detections");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Detections");

            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "Detections");

            migrationBuilder.AddForeignKey(
                name: "FK_Detections_Persons_PersonId",
                table: "Detections",
                column: "PersonId",
                principalTable: "Persons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
