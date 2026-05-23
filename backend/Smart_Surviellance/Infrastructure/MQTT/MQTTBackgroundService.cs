using Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MQTTnet;
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;

namespace Infrastructure.MQTT
{
    public class MQTTBackgroundService : IHostedService
    {

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<MQTTBackgroundService> _logger;
        private IMqttClient? _mqttClient;

        public MQTTBackgroundService(IServiceScopeFactory scopeFactory, IConfiguration config, ILogger<MQTTBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _config = config;
            _logger = logger;
        }




        public async Task StartAsync(CancellationToken cancellationToken)
        {
            var factory = new MqttClientFactory();
            _mqttClient = factory.CreateMqttClient();

            _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;

            _mqttClient.DisconnectedAsync += OnDisconnectedAsync;

            await ConnectAndSubscribeAsync();

        }

        public async Task StopAsync(CancellationToken cancellationToken)
        {
            if (_mqttClient?.IsConnected == true)
            {
                await _mqttClient.DisconnectAsync();
                _logger.LogInformation("MQTT client disconnected cleanly.");
            }
            _mqttClient?.Dispose();
        }






        private async Task ConnectAndSubscribeAsync()
        {
            var host = _config["MQTT:Host"] ?? "localhost";
            var port = int.TryParse(_config["MQTT:Port"], out var p) ? p : 1883;
            var clientId = _config["MQTT:ClientId"] ?? "SmartSurviellanceServer";
            var prefix = _config["MQTT:Topic"] ?? "surveillance/sensors";



            var options = new MqttClientOptionsBuilder()
                .WithTcpServer(host, port)
                .WithClientId(clientId)
                .WithCleanSession(true)
                .Build();



            await _mqttClient!.ConnectAsync(options);
            _logger.LogInformation("Connected to MQTT broker at {Host}:{Port}", host, port);


            var topicFilter = new MqttTopicFilterBuilder()
                .WithTopic($"{prefix}/#")
                .Build();

            await _mqttClient.SubscribeAsync(topicFilter);
            _logger.LogInformation("Subscribed to MQTT topic {Topic}", $"{prefix}/#");










        }


        private async Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
        {

            var topic = e.ApplicationMessage.Topic;


            var parts = topic.Split('/');
            if (!int.TryParse(parts.Last(), out int sensorId))
            {
                _logger.LogWarning("Cannot parse sensorId from topic: {Topic}", topic);
                return; // ignore malformed topics — don't crash
            }



            var payloadBytes = e.ApplicationMessage.Payload;
            var payloadJson = Encoding.UTF8.GetString(payloadBytes);


            SensorPayload? data;
            try
            {
                data = JsonSerializer.Deserialize<SensorPayload>(payloadJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize MQTT payload for sensor {Topic}: {Payload}", topic, payloadJson);
                return; // ignore malformed payloads — don't crash

            }

            if (data is null)
            {
                _logger.LogWarning("Deserialized MQTT payload is null for sensor {Topic}: {Payload}", topic, payloadJson);
                return; // ignore null payloads — don't crash
            }



            using var scope = _scopeFactory.CreateScope();
            var sensorService = scope.ServiceProvider.GetRequiredService<ISensorService>();


            var result = await sensorService.RecordReadingAsync(sensorId, data.Value);

            // check the threshold and make an alert

            
            
            // end

            if (!result.IsSuccess)
            {
                _logger.LogWarning(
                    "Failed to record reading for sensor {Id}: {Message}",
                    sensorId, result.Message);
            }
            else
            {
                _logger.LogInformation(
                    "Sensor {Id} reading recorded: {Value}", sensorId, data.Value);
            }



        }



        private async Task OnDisconnectedAsync(MqttClientDisconnectedEventArgs e)
        {
            
            if (!e.ClientWasConnected)
            {
                _logger.LogInformation("MQTT disconnected intentionally. Not reconnecting.");
                return;
            }
            _logger.LogWarning(
                "MQTT disconnected unexpectedly (Reason: {Reason}). Retrying in 5 seconds...",
                e.Reason);
            

            await Task.Delay(TimeSpan.FromSeconds(5));
            try
            {
                await ConnectAndSubscribeAsync();
            }
            catch (Exception ex)
            {                
                _logger.LogError(ex, "MQTT reconnection attempt failed. Will retry on next disconnect event.");
            }
        }


        private record SensorPayload(double Value);


    }
}
