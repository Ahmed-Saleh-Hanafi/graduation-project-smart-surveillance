using Application.Interfaces;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Infrastructure.SignalR
{
    [Authorize]
    public class AlertHub : Hub
    {
        private readonly ApplicationDbContext _context;

        public AlertHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = Context.User?.IsInRole("Admin") ?? false;

            if (isAdmin)
            {
                // Admin joins the "admin" group — receives ALL alerts
                await Groups.AddToGroupAsync(Context.ConnectionId, "admin");
            }
            else if (userId != null)
            {
                // Regular user: join only groups for their assigned cameras
                var cameraIds = await _context.UserCameras
                    .Where(uc => uc.UserId == userId)
                    .Select(uc => uc.CameraId)
                    .ToListAsync();

                foreach (var cameraId in cameraIds)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, $"camera-{cameraId}");
                }
            }

            await base.OnConnectedAsync();
        }
    }
}

